import requests
from decouple import config

SPOTIFY_AUTH_URL = "https://accounts.spotify.com/api/token"
SPOTIFY_BASE_URL = "https://api.spotify.com/v1"
CLIENT_ID = config("SPOTIFY_CLIENT_ID")
CLIENT_SECRET = config("SPOTIFY_CLIENT_SECRET")


def get_spotify_access_token():
    auth_response = requests.post(
        SPOTIFY_AUTH_URL,
        data={"grant_type": "client_credentials"},
        headers={
            "Authorization": f"Basic {requests.auth._basic_auth_str(CLIENT_ID, CLIENT_SECRET)}",
        },
    )
    if auth_response.status_code != 200:
        raise Exception("Failed to get Spotify access token")

    return auth_response.json().get("access_token")


def search_album(query):
    access_token = get_spotify_access_token()
    headers = {"Authorization": f"Bearer {access_token}"}
    response = requests.get(
        f"{SPOTIFY_BASE_URL}/search",
        headers=headers,
        params={"q": query, "type": "album", "limit": 10},
    )
    return response.json()
