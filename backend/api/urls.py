from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.routers import DefaultRouter
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
    register_user,
    ListViewSet,
    get_trending_albums,
    add_album_to_list,
    get_album_tracks,
    update_album_ranks
)

router = DefaultRouter()
router.register(r'lists', ListViewSet, basename='list')

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
    path('', include(router.urls)),

    # Trending albums
    path('trending-albums/', get_trending_albums, name='trending-albums'),

    # Add album to list
    path('lists/<int:list_id>/add_album/', add_album_to_list, name='add-album-to-list'),

    # Tracks endpoint
    path('spotify/tracks/<str:spotify_id>/', get_album_tracks, name='album-tracks'),

    # Update album ranks
    path('lists/<int:list_id>/update_ranks/', update_album_ranks, name='update-album-ranks'),
]
