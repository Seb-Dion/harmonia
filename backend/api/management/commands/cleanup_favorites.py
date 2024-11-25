from django.core.management.base import BaseCommand
from api.models import FavoriteAlbum, Album

class Command(BaseCommand):
    help = 'Cleanup invalid favorite albums'

    def handle(self, *args, **options):
        # Remove favorites with null spotify_id
        invalid_albums = Album.objects.filter(spotify_id__isnull=True)
        count = FavoriteAlbum.objects.filter(album__in=invalid_albums).delete()[0]
        self.stdout.write(self.style.SUCCESS(f'Removed {count} invalid favorites'))