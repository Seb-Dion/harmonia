from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
    CreateUserView, 
    UserProfileView, 
    SpotifyAlbumView,
    FavoriteAlbumView,
    FollowUserView
)

# Router for ViewSets
router = DefaultRouter()


# URL patterns for API views
urlpatterns = [
    path('spotify/albums/', SpotifyAlbumView.as_view(), name='spotify-albums'),
    path('user/profile/', UserProfileView.as_view(), name='user-profile'),
    path('user/favorites/', FavoriteAlbumView.as_view(), name='favorite-albums'),
    path('user/favorites/<str:spotify_id>/', FavoriteAlbumView.as_view(), name='favorite-album-detail'),
    path('user/follow/<int:user_id>/', FollowUserView.as_view(), name='follow-user'),
]

# Include ViewSet routes from the router
urlpatterns += router.urls
