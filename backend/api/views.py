from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth.models import User
from .serializers import UserSerializer
import requests
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

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
    
    def get(self, request):
        user = request.user
        return Response({
            'id': user.id,
            'username': user.username,
            'date_joined': user.date_joined
        })