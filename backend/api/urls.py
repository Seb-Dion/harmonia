from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import SpotifyAlbumView

# Router for ViewSets
router = DefaultRouter()


# URL patterns for API views
urlpatterns = [
    path('spotify/albums/', SpotifyAlbumView.as_view(), name='spotify-albums'),
]

# Include ViewSet routes from the router
urlpatterns += router.urls
