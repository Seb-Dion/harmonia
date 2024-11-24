from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Album, Log, Profile, FavoriteAlbum


# User Serializer
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "password"]
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        print(validated_data)
        user = User.objects.create_user(**validated_data)
        return user

# Album Serializer
class AlbumSerializer(serializers.ModelSerializer):
    class Meta:
        model = Album
        fields = ['id', 'spotify_id', 'name', 'artist', 'image_url', 'release_date', 'external_url']

# Log Serializer
class LogSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)  # Read-only nested user details
    album = AlbumSerializer(read_only=True)  # Read-only nested album details

    class Meta:
        model = Log
        fields = ['id', 'user', 'album', 'rating', 'review', 'created_at']

    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['user'] = request.user
        return super().create(validated_data)

# Profile Serializer
class ProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    avatar_url = serializers.SerializerMethodField()
    favorite_albums = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = ['id', 'username', 'bio', 'avatar', 'avatar_url', 'favorite_albums']

    def get_avatar_url(self, obj):
        if obj.avatar:
            return self.context['request'].build_absolute_uri(obj.avatar.url)
        return None

    def get_favorite_albums(self, obj):
        favorites = FavoriteAlbum.objects.filter(user=obj.user)
        return FavoriteAlbumSerializer(favorites, many=True).data

# Favorite Album Serializer
class FavoriteAlbumSerializer(serializers.ModelSerializer):
    class Meta:
        model = FavoriteAlbum
        fields = ['spotify_id', 'name', 'artist', 'image_url', 'added_at']
