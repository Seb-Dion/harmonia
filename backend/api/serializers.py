from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Album, Log, Profile, FavoriteAlbum
from django.utils import timezone


# User Serializer
class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('username', 'password', 'email')
        extra_kwargs = {'email': {'required': False}}

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            email=validated_data.get('email', '')
        )
        return user

# Album Serializer
class AlbumSerializer(serializers.ModelSerializer):
    average_rating = serializers.DecimalField(
        max_digits=3, 
        decimal_places=2, 
        read_only=True
    )
    total_logs = serializers.IntegerField(read_only=True)

    class Meta:
        model = Album
        fields = [
            'id', 
            'spotify_id', 
            'name', 
            'artist', 
            'image_url', 
            'release_date', 
            'external_url',
            'genres',
            'average_rating',
            'total_logs'
        ]
        read_only_fields = ['id', 'average_rating', 'total_logs']

    def validate_spotify_id(self, value):
        """
        Check that the spotify_id is valid.
        """
        if not value:
            raise serializers.ValidationError("spotify_id is required")
        return value

    def validate_release_date(self, value):
        """
        Check that the release_date is valid.
        """
        if not value:
            raise serializers.ValidationError("release_date is required")
        return value

# Favorite Album Serializer
class FavoriteAlbumSerializer(serializers.ModelSerializer):
    album = AlbumSerializer(read_only=True)
    
    class Meta:
        model = FavoriteAlbum
        fields = ['id', 'album', 'added_at']
        read_only_fields = ['added_at']

# Log Serializer
class LogSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    album = AlbumSerializer(read_only=True)
    album_id = serializers.PrimaryKeyRelatedField(
        queryset=Album.objects.all(),
        write_only=True,
        source='album'
    )

    class Meta:
        model = Log
        fields = [
            'id',
            'user',
            'album',
            'album_id',
            'rating',
            'review',
            'created_at',
            'updated_at',
            'listen_date',
            'favorite_tracks',
            'relisten'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def validate_rating(self, value):
        if not 1 <= value <= 5:
            raise serializers.ValidationError("Rating must be between 1 and 5")
        return value

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

# Profile Serializer
class ProfileSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()
    username = serializers.CharField(source='user.username', read_only=True)
    followers_count = serializers.IntegerField(read_only=True)
    favorite_albums = serializers.SerializerMethodField()
    total_logs = serializers.SerializerMethodField()
    logs_this_year = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = ['id', 'username', 'bio', 'avatar', 'avatar_url', 'followers_count', 'favorite_albums', 'total_logs', 'logs_this_year']
        read_only_fields = ['id', 'username', 'followers_count', 'favorite_albums', 'total_logs', 'logs_this_year']

    def get_favorite_albums(self, obj):
        favorites = FavoriteAlbum.objects.filter(user=obj.user)
        return FavoriteAlbumSerializer(favorites, many=True).data

    def get_avatar_url(self, obj):
        if obj.avatar and hasattr(obj.avatar, 'url'):
            request = self.context.get('request')
            if request is not None:
                try:
                    return request.build_absolute_uri(obj.avatar.url)
                except Exception as e:
                    print(f"Error building avatar URL: {e}")
                    return None
        return None

    def update(self, instance, validated_data):
        print("Updating profile with:", validated_data)  # Debug print
        avatar = validated_data.pop('avatar', None)
        if avatar:
            instance.avatar = avatar
        return super().update(instance, validated_data)

    def get_total_logs(self, obj):
        return Log.objects.filter(user=obj.user).count()

    def get_logs_this_year(self, obj):
        current_year = timezone.now().year
        return Log.objects.filter(
            user=obj.user,
            created_at__year=current_year
        ).count()
