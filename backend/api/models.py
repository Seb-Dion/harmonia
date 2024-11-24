from django.db import models
from django.contrib.auth.models import User


# Album Model
class Album(models.Model):
    title = models.CharField(max_length=255)
    artist = models.CharField(max_length=255)
    release_date = models.DateField(null=True, blank=True)
    cover_url = models.URLField(blank=True, null=True)

    def __str__(self):
        return f"{self.title} by {self.artist}"


# Log Model
class Log(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    album = models.ForeignKey(Album, on_delete=models.CASCADE)
    rating = models.PositiveSmallIntegerField()
    review = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.album.title}"
