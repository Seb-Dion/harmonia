from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    bio = models.TextField(max_length=500, blank=True, null=True)
    followers = models.ManyToManyField(User, related_name='following', blank=True)

    def __str__(self):
        return f"{self.user.username}'s profile"
    
    @property
    def followers_count(self):
        return self.followers.count()



# Album Model
class Album(models.Model):
    spotify_id = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=200)
    artist = models.CharField(max_length=200)
    image_url = models.URLField(blank=True, null=True)
    release_date = models.DateField()
    external_url = models.URLField(blank=True, null=True)

    def __str__(self):
        return f"{self.name} by {self.artist}"

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()

# Log Model
class Log(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    album = models.ForeignKey(Album, on_delete=models.CASCADE)
    rating = models.PositiveSmallIntegerField()
    review = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.album.title}"

# Add this to your existing models
class FavoriteAlbum(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='favorite_albums')
    spotify_id = models.CharField(max_length=100)
    name = models.CharField(max_length=200)
    artist = models.CharField(max_length=200)
    image_url = models.URLField()
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'spotify_id')
        ordering = ['-added_at']

    def __str__(self):
        return f"{self.name} by {self.artist}"
