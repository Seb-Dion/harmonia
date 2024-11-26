from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    CreateUserView,
    UserProfileView,
    spotify_search,
    add_favorite_album,
    list_favorite_albums,
    remove_favorite_album,
    LogAlbumView,
    LogDetailView,
    UserStatsView,
    create_album,
    register_user
)

urlpatterns = [
    # Authentication endpoints
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # User endpoints
    path('user/register/', CreateUserView.as_view(), name='register'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('stats/', UserStatsView.as_view(), name='user-stats'),
    
    # Spotify search
    path('spotify/search/', spotify_search, name='spotify-search'),
    
    # Favorite albums endpoints
    path('favorites/', list_favorite_albums, name='favorite-albums'),
    path('favorites/add/', add_favorite_album, name='add-favorite'),
    path('favorites/<str:album_id>/', remove_favorite_album, name='remove-favorite'),
    
    # Logging endpoints
    path('logs/', LogAlbumView.as_view(), name='album-logs'),
    path('logs/<int:log_id>/', LogDetailView.as_view(), name='log-detail'),
    path('albums/create/', create_album, name='create-album'),
]
