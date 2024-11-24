from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django.contrib.auth.models import User
from .models import Profile, Album, FavoriteAlbum
from .serializers import UserSerializer, ProfileSerializer, AlbumSerializer, FavoriteAlbumSerializer
import requests
import os
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

class CreateUserView(generics.CreateAPIView):
    """View for user registration"""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

class SpotifyAlbumView(APIView):
    """View for searching Spotify albums"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Get credentials from environment variables
        client_id = os.getenv('SPOTIFY_CLIENT_ID')
        client_secret = os.getenv('SPOTIFY_CLIENT_SECRET')
        
        # Debug logging
        print(f"Client ID exists: {client_id is not None}")
        print(f"Client Secret exists: {client_secret is not None}")
        
        try:
            # Get Spotify access token
            auth_response = requests.post('https://accounts.spotify.com/api/token', {
                'grant_type': 'client_credentials',
                'client_id': client_id,
                'client_secret': client_secret,
            })
            auth_response.raise_for_status()
            
            # Debug logging
            print(f"Auth response status: {auth_response.status_code}")
            print(f"Auth response content: {auth_response.content}")
            
            spotify_token = auth_response.json()['access_token']
            
            # Get search query from request
            query = request.query_params.get('query', '')
            print(f"Search query: {query}")  # Debug logging
            
            if not query:
                return Response(
                    {'error': 'Query parameter is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Search Spotify
            headers = {
                'Authorization': f'Bearer {spotify_token}'
            }
            
            search_response = requests.get(
                'https://api.spotify.com/v1/search',
                headers=headers,
                params={
                    'q': query,
                    'type': 'album',
                    'limit': 20
                }
            )
            search_response.raise_for_status()
            
            # Debug logging
            print(f"Search response status: {search_response.status_code}")
            print(f"Search response content: {search_response.content[:200]}")  # First 200 chars
            
            # Extract just the albums from the response
            response_data = search_response.json()
            if 'albums' not in response_data:
                print(f"Response data keys: {response_data.keys()}")  # Debug logging
                return Response(
                    {'error': 'Unexpected API response format'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
            albums = response_data.get('albums', {}).get('items', [])
            
            # Format the response
            formatted_albums = []
            for album in albums:
                if not album:  # Skip if album is None
                    continue
                    
                try:
                    formatted_albums.append({
                        'id': album.get('id'),
                        'name': album.get('name'),
                        'artist': album.get('artists', [{}])[0].get('name'),
                        'image_url': album.get('images', [{}])[0].get('url') if album.get('images') else None,
                        'release_date': album.get('release_date'),
                        'total_tracks': album.get('total_tracks'),
                        'external_url': album.get('external_urls', {}).get('spotify')
                    })
                except (KeyError, IndexError, AttributeError) as e:
                    print(f"Error formatting album: {e}")
                    print(f"Album data: {album}")
                    continue
            
            return Response({
                'albums': formatted_albums,
                'total': len(formatted_albums)
            })
            
        except requests.exceptions.RequestException as e:
            print(f"Request error: {str(e)}")  # Debug logging
            return Response(
                {'error': f'Spotify API error: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        except KeyError as e:
            print(f"Key error: {str(e)}")  # Debug logging
            return Response(
                {'error': f'Unexpected response format: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        except Exception as e:
            print(f"Unexpected error: {str(e)}")  # Debug logging
            import traceback
            print(traceback.format_exc())  # Print full traceback
            return Response(
                {'error': f'Unexpected error: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class UserProfileView(APIView):
    """View for getting user profile information"""
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)
    
    def get(self, request):
        try:
            profile = Profile.objects.get(user=request.user)
            serializer = ProfileSerializer(profile, context={'request': request})
            print("Profile data:", serializer.data)  # Debug print
            return Response(serializer.data)
        except Profile.DoesNotExist:
            return Response({'error': 'Profile not found'}, status=404)

    def put(self, request):
        profile = Profile.objects.get(user=request.user)
        serializer = ProfileSerializer(profile, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class FavoriteAlbumView(APIView):
    """View for managing favorite albums"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            # Debug print the incoming data
            print("Received data:", request.data)
            
            # Validate required fields
            required_fields = ['spotify_id', 'name', 'artist', 'image_url']
            for field in required_fields:
                if field not in request.data:
                    return Response(
                        {'error': f'Missing required field: {field}'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            # Check if user already has 4 favorites
            current_favorites = FavoriteAlbum.objects.filter(user=request.user).count()
            if current_favorites >= 4:
                return Response(
                    {'error': 'Maximum number of favorite albums (4) reached'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Check if album is already a favorite
            existing_favorite = FavoriteAlbum.objects.filter(
                user=request.user,
                spotify_id=request.data['spotify_id']
            ).first()

            if existing_favorite:
                return Response(
                    {'error': 'Album is already in favorites'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Create new favorite
            favorite = FavoriteAlbum.objects.create(
                user=request.user,
                spotify_id=request.data['spotify_id'],
                name=request.data['name'],
                artist=request.data['artist'],
                image_url=request.data['image_url']
            )
            
            return Response({
                'spotify_id': favorite.spotify_id,
                'name': favorite.name,
                'artist': favorite.artist,
                'image_url': favorite.image_url
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Error adding favorite: {str(e)}", exc_info=True)
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def delete(self, request, spotify_id):
        try:
            favorite = FavoriteAlbum.objects.get(
                user=request.user,
                spotify_id=spotify_id
            )
            favorite.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except FavoriteAlbum.DoesNotExist:
            return Response(
                {'error': 'Favorite album not found'},
                status=status.HTTP_404_NOT_FOUND
            )

class FollowUserView(APIView):
    """View for following/unfollowing users"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, user_id):
        try:
            user_to_follow = User.objects.get(id=user_id)
            profile = Profile.objects.get(user=request.user)
            
            if user_to_follow == request.user:
                return Response(
                    {'error': 'You cannot follow yourself'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if user_to_follow in profile.followers.all():
                profile.followers.remove(user_to_follow)
                return Response({'message': 'User unfollowed'})
            else:
                profile.followers.add(user_to_follow)
                return Response({'message': 'User followed'})
                
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )

class SpotifyAlbumSearchView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = request.GET.get('query', '')
        if not query:
            return Response({'results': []})

        try:
            # Your Spotify search logic here
            spotify_results = spotify.search(query, type='album')
            
            # Debug print
            print("Spotify search results:", spotify_results)

            results = []
            for album in spotify_results['albums']['items']:
                album_data = {
                    'spotify_id': album['id'],
                    'name': album['name'],
                    'artist': album['artists'][0]['name'] if album['artists'] else 'Unknown Artist',
                    'image_url': album['images'][0]['url'] if album['images'] else None,
                }
                results.append(album_data)

            return Response({'results': results})
        except Exception as e:
            logger.error(f"Spotify search error: {str(e)}", exc_info=True)
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )