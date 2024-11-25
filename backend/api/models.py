from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.validators import MinValueValidator, MaxValueValidator

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

class Album(models.Model):
    spotify_id = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=200)
    artist = models.CharField(max_length=200)
    image_url = models.URLField(blank=True, null=True)
    release_date = models.DateField()
    external_url = models.URLField(blank=True, null=True)
    genres = models.CharField(max_length=200, blank=True, null=True)
    
    average_rating = models.DecimalField(
        max_digits=3, 
        decimal_places=2, 
        default=0
    )
    total_logs = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['-release_date']

    def __str__(self):
        return f"{self.name} by {self.artist}"

class Log(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    album = models.ForeignKey(Album, on_delete=models.CASCADE)
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    review = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    listen_date = models.DateField(null=True, blank=True)
    favorite_tracks = models.TextField(blank=True, null=True)
    relisten = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']
        unique_together = ['user', 'album', 'listen_date']

    def __str__(self):
        return f"{self.user.username} - {self.album.name} ({self.rating}★)"

class FavoriteAlbum(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='favorite_albums')
    album = models.ForeignKey(Album, on_delete=models.CASCADE)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'album')
        ordering = ['-added_at']

    def __str__(self):
        return f"{self.album.name} by {self.album.artist}"

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()
