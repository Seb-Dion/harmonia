from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db.models import Avg, Count
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
from django.conf import settings
from .models import Album, Log, Profile, FavoriteAlbum, List, ListAlbum
from .serializers import (
    UserSerializer,
    ProfileSerializer,
    AlbumSerializer,
    LogSerializer,
    FavoriteAlbumSerializer,
    ListAlbumSerializer,
    ListSerializer
)
from rest_framework.parsers import MultiPartParser, FormParser
from datetime import datetime, timedelta
from django.db import IntegrityError
from django.contrib.auth.models import User
from rest_framework import generics
from rest_framework import viewsets
from rest_framework.decorators import action
import logging

logger = logging.getLogger(__name__)

class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]
    
    def perform_create(self, serializer):
        user = serializer.save()
        return user

class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user.profile

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        data = serializer.data
        
        # Add additional stats
        logs = Log.objects.filter(user=request.user)
        
        # Calculate last 30 days logs
        thirty_days_ago = datetime.now() - timedelta(days=30)
        last_month_logs = logs.filter(created_at__gte=thirty_days_ago).count()
        
        # Calculate average rating
        avg_rating = logs.aggregate(Avg('rating'))['rating__avg']
        
        # Get most logged artist
        artist_counts = logs.values('album__artist').annotate(
            count=Count('album__artist')
        ).order_by('-count')
        top_artist = artist_counts[0]['album__artist'] if artist_counts else None
        
        # Get most common genre
        genre_counts = {}
        for log in logs:
            if log.album.genres:
                genres = log.album.genres.split(',')
                for genre in genres:
                    genre = genre.strip()
                    if genre:
                        genre_counts[genre] = genre_counts.get(genre, 0) + 1
        
        top_genre = max(genre_counts.items(), key=lambda x: x[1])[0] if genre_counts else None
        
        data.update({
            'lastMonth': last_month_logs,
            'averageRating': round(avg_rating, 1) if avg_rating else 0,
            'topArtist': top_artist,
            'topGenre': top_genre or 'None yet'
        })
        
        return Response(data)

    def patch(self, request):
        profile = request.user.profile
        print("Received data:", request.data)
        print("Files:", request.FILES)
        
        serializer = ProfileSerializer(
            profile,
            data=request.data,
            partial=True,
            context={'request': request}
        )
        
        if serializer.is_valid():
            print("Valid data:", serializer.validated_data)
            serializer.save()
            profile.refresh_from_db()
            return Response(
                ProfileSerializer(profile, context={'request': request}).data
            )
        print("Validation errors:", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def spotify_search(request):
    query = request.GET.get('q', '')
    print(f"Received search query: {query}")
    
    try:
        spotify = spotipy.Spotify(
            client_credentials_manager=SpotifyClientCredentials(
                client_id=settings.SPOTIFY_CLIENT_ID,
                client_secret=settings.SPOTIFY_CLIENT_SECRET
            )
        )
        
        # Increase limit to 50 and specify we want tracks
        results = spotify.search(
            q=query,
            type='track',
            limit=50  # Increased from default 20 to 50
        )
        print(f"Search results: {results}")
        return Response(results)
    except Exception as e:
        print(f"Search error: {e}")
        return Response(
            {'error': 'Failed to search Spotify'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_favorite_album(request):
    try:
        print("Received data:", request.data)  # Debug log
        
        # Validate required fields
        required_fields = ['spotify_id', 'name', 'artist', 'release_date']
        for field in required_fields:
            if field not in request.data:
                return Response(
                    {'error': f'Missing required field: {field}'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # First, get or create the album
        album_data = {
            'spotify_id': request.data['spotify_id'],
            'name': request.data['name'],
            'artist': request.data['artist'],
            'image_url': request.data.get('image_url'),
            'release_date': request.data.get('release_date'),
            'external_url': request.data.get('external_url'),
            'genres': request.data.get('genres', '')
        }
        
        print("Album data:", album_data)  # Debug log
        
        album, created = Album.objects.get_or_create(
            spotify_id=album_data['spotify_id'],
            defaults=album_data
        )
        print(f"Album {'created' if created else 'found'}:", album)  # Debug log

        # Check if user already has 4 favorites
        existing_favorites = FavoriteAlbum.objects.filter(user=request.user).count()
        if existing_favorites >= 4:
            return Response(
                {'error': 'Maximum number of favorites (4) reached'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Then create the favorite
        favorite, created = FavoriteAlbum.objects.get_or_create(
            user=request.user,
            album=album
        )

        if not created:
            return Response(
                {'message': 'Album already in favorites'},
                status=status.HTTP_200_OK
            )

        serializer = FavoriteAlbumSerializer(favorite)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    except KeyError as e:
        return Response(
            {'error': f'Missing required field: {str(e)}'},
            status=status.HTTP_400_BAD_REQUEST
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_favorite_albums(request):
    favorites = FavoriteAlbum.objects.filter(user=request.user)
    print("Found favorites:", favorites.count())  # Debug log
    for fav in favorites:
        print(f"Favorite: {fav.album.name} by {fav.album.artist}")  # Debug log
    serializer = FavoriteAlbumSerializer(favorites, many=True)
    print("Serialized data:", serializer.data)  # Debug log
    return Response(serializer.data)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_favorite_album(request, album_id):
    try:
        if not album_id or album_id == 'undefined':
            return Response(
                {'error': 'Invalid album ID'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        favorite = FavoriteAlbum.objects.get(
            user=request.user,
            album__spotify_id=album_id
        )
        favorite.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    except FavoriteAlbum.DoesNotExist:
        return Response(
            {'error': 'Album not in favorites'},
            status=status.HTTP_404_NOT_FOUND
        )

class LogAlbumView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            # Add user to request data
            data = request.data.copy()
            
            # Get or create the album first
            album_id = data.get('album_id')
            try:
                album = Album.objects.get(spotify_id=album_id)
            except Album.DoesNotExist:
                return Response(
                    {'error': 'Album not found'},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Create the log with the user
            serializer = LogSerializer(
                data=data,
                context={'request': request}
            )
            
            if serializer.is_valid():
                log = serializer.save(user=request.user, album=album)
                
                # Update album stats
                album.total_logs += 1
                logs = Log.objects.filter(album=album)
                album.average_rating = logs.aggregate(Avg('rating'))['rating__avg']
                album.save()
                
                return Response(
                    LogSerializer(log).data,
                    status=status.HTTP_201_CREATED
                )
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
            
        except Exception as e:
            print(f"Error creating log: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def get(self, request):
        logs = Log.objects.filter(user=request.user).select_related('album')
        serializer = LogSerializer(logs, many=True)
        return Response(serializer.data)

class LogDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, log_id):
        log = get_object_or_404(Log, id=log_id, user=request.user)
        serializer = LogSerializer(log)
        return Response(serializer.data)

    def put(self, request, log_id):
        log = get_object_or_404(Log, id=log_id, user=request.user)
        serializer = LogSerializer(log, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, log_id):
        log = get_object_or_404(Log, id=log_id, user=request.user)
        log.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class UserStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        logs = Log.objects.filter(user=request.user)
        
        stats = {
            'total_albums': logs.count(),
            'average_rating': logs.aggregate(Avg('rating'))['rating__avg'] or 0,
            'total_relistens': logs.filter(relisten=True).count(),
            'ratings_distribution': {
                '5': logs.filter(rating=5).count(),
                '4': logs.filter(rating=4).count(),
                '3': logs.filter(rating=3).count(),
                '2': logs.filter(rating=2).count(),
                '1': logs.filter(rating=1).count(),
            }
        }
        
        return Response(stats)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_album(request):
    try:
        data = request.data.copy()
        
        # Format release date if needed
        release_date = data.get('release_date', '')
        if len(release_date) == 4:  # YYYY
            data['release_date'] = f"{release_date}-01-01"
        elif len(release_date) == 7:  # YYYY-MM
            data['release_date'] = f"{release_date}-01"
        
        print("Processing album data:", data)  # Debug print
        
        # Try to get existing album first
        try:
            album = Album.objects.get(spotify_id=data['spotify_id'])
            print("Found existing album:", album)  # Debug print
            
            # Update album data
            serializer = AlbumSerializer(album, data=data)
            if serializer.is_valid():
                album = serializer.save()
                return Response(AlbumSerializer(album).data, status=status.HTTP_200_OK)
            else:
                print("Update validation errors:", serializer.errors)  # Debug print
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                
        except Album.DoesNotExist:
            print("Creating new album")  # Debug print
            # Create new album
            serializer = AlbumSerializer(data=data)
            if serializer.is_valid():
                album = serializer.save()
                return Response(AlbumSerializer(album).data, status=status.HTTP_201_CREATED)
            else:
                print("Creation validation errors:", serializer.errors)  # Debug print
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                
    except Exception as e:
        print("Unexpected error:", str(e))  # Debug print
        return Response(
            {"error": str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )

@api_view(['POST'])
@permission_classes([AllowAny])  # Allow anyone to register
def register_user(request):
    try:
        data = request.data
        print("Received registration data:", data)  # Debug print

        # Check if username exists
        if User.objects.filter(username=data['username']).exists():
            return Response(
                {'error': 'Username already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create user
        user = User.objects.create_user(
            username=data['username'],
            email=data.get('email', ''),
            password=data['password']
        )

        return Response(
            {'message': 'User created successfully'},
            status=status.HTTP_201_CREATED
        )

    except KeyError as e:
        return Response(
            {'error': f'Missing required field: {str(e)}'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except IntegrityError as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        print("Registration error:", str(e))  # Debug print
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )

class ListViewSet(viewsets.ModelViewSet):
    serializer_class = ListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return List.objects.filter(user=self.request.user)

    def retrieve(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            print(f"Retrieved list: {instance.title}")  # Debug log
            print(f"Number of albums: {instance.albums.count()}")  # Debug log
            
            serializer = self.get_serializer(instance)
            data = serializer.data
            print(f"Serialized data: {data}")  # Debug log
            
            return Response(data)
        except Exception as e:
            print(f"Error retrieving list: {str(e)}")  # Debug log
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def albums(self, request, pk=None):
        list_obj = self.get_object()
        
        try:
            # Add the list ID to the request data
            album_data = request.data.copy()
            album_data['list'] = list_obj.id
            
            # Check if album already exists in list
            existing_album = ListAlbum.objects.filter(
                list=list_obj,
                spotify_id=album_data['spotify_id']
            ).first()
            
            if existing_album:
                return Response(
                    {'error': 'Album already in list'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            serializer = ListAlbumSerializer(data=album_data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            else:
                return Response(
                    {'error': 'Invalid data', 'details': serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['delete'])
    def remove_album(self, request, pk=None):
        list_obj = self.get_object()
        album_id = request.query_params.get('album_id')
        
        try:
            album = ListAlbum.objects.get(
                list=list_obj,
                spotify_id=album_id
            )
            album.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ListAlbum.DoesNotExist:
            return Response(
                {'error': 'Album not found in list'},
                status=status.HTTP_404_NOT_FOUND
            )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_trending_albums(request):
    try:
        spotify = spotipy.Spotify(client_credentials_manager=SpotifyClientCredentials(
            client_id=settings.SPOTIFY_CLIENT_ID,
            client_secret=settings.SPOTIFY_CLIENT_SECRET
        ))
        
        # Get new releases instead of featured playlists
        new_releases = spotify.new_releases(limit=20, country='US')
        
        trending_albums = []
        for album in new_releases['albums']['items']:
            trending_albums.append({
                'spotify_id': album['id'],
                'name': album['name'],
                'artist': album['artists'][0]['name'],
                'image_url': album['images'][0]['url'] if album['images'] else None,
                'release_date': album['release_date']
            })
        
        return Response(trending_albums)
    except Exception as e:
        print(f"Error in get_trending_albums: {str(e)}")  # Debug log
        return Response({'error': str(e)}, status=400)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_album_to_list(request, list_id):
    try:
        list_obj = List.objects.get(id=list_id, user=request.user)
        album_data = request.data
        print("Received album data:", album_data)
        
        # Get the next rank
        next_rank = ListAlbum.objects.filter(list=list_obj).count() + 1
        
        # Check if album already exists in the list
        existing_album = ListAlbum.objects.filter(
            list=list_obj,
            spotify_id=album_data['spotify_id']
        ).first()
        
        if existing_album:
            return Response(
                {'message': 'Album already exists in this list'},
                status=status.HTTP_200_OK
            )
        
        # Get primary genre from Spotify artist
        primary_genre = ''
        try:
            spotify = spotipy.Spotify(client_credentials_manager=SpotifyClientCredentials(
                client_id=settings.SPOTIFY_CLIENT_ID,
                client_secret=settings.SPOTIFY_CLIENT_SECRET
            ))
            
            # First get the album to find the artist ID
            album_info = spotify.album(album_data['spotify_id'])
            if album_info['artists']:
                # Get the primary artist's genres
                artist_id = album_info['artists'][0]['id']
                artist_info = spotify.artist(artist_id)
                genres = artist_info.get('genres', [])
                # Only take the first genre if available
                primary_genre = genres[0] if genres else ''
                print(f"Found primary genre for artist {artist_info['name']}: {primary_genre}")
            
        except Exception as e:
            print(f"Error fetching artist genre: {str(e)}")
        
        # Create the ListAlbum instance with primary genre
        list_album = ListAlbum.objects.create(
            list=list_obj,
            spotify_id=album_data['spotify_id'],
            name=album_data['name'],
            artist=album_data['artist'],
            image_url=album_data.get('image_url', ''),
            release_date=album_data.get('release_date'),
            external_url=album_data['external_url'],
            genres=primary_genre,
            rank=next_rank
        )
        
        print(f"Created ListAlbum with primary genre: {list_album.genres}")
        
        return Response({
            'message': 'Album added to list successfully',
            'list_album': ListAlbumSerializer(list_album).data
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        print(f"Error adding album to list: {str(e)}")
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_400_BAD_REQUEST
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_album_tracks(request, spotify_id):
    try:
        spotify = spotipy.Spotify(client_credentials_manager=SpotifyClientCredentials(
            client_id=settings.SPOTIFY_CLIENT_ID,
            client_secret=settings.SPOTIFY_CLIENT_SECRET
        ))
        
        album_tracks = spotify.album_tracks(spotify_id)
        return Response({"tracks": album_tracks['items']})
    except Exception as e:
        return Response({'error': str(e)}, status=400)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_album_ranks(request, list_id):
    try:
        list_obj = List.objects.get(id=list_id, user=request.user)
        albums_data = request.data  # Expect array of {id: X, rank: Y}
        
        for album_data in albums_data:
            album = ListAlbum.objects.get(
                id=album_data['id'],
                list=list_obj
            )
            album.rank = album_data['rank']
            album.save()
            
        return Response({'message': 'Rankings updated successfully'})
        
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_400_BAD_REQUEST
        )

