# Harmonia

Welcome to Harmonia! This application allows users to track, review, and share their favorite albums. With features like personalized lists, album reviews, and social interactions, it's the perfect tool for music enthusiasts.

## Features

- **User Profiles**: Customize your profile with an avatar and bio.
- **Album Search**: Find albums using the integrated Spotify API.
- **Favorite Albums**: Keep track of your top albums.
- **Lists**: Create and manage custom album lists.
- **Reviews**: Write and share reviews for albums.
- **Recent Activity**: View your latest reviews and logs.

## Tech Stack

- **Frontend**: React with Vite
- **Backend**: Django
- **Database**: SQLite

## Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/yourusername/harmonia.git
   cd harmonia
   ```

2. **Backend Setup**:
   - Navigate to the backend directory:
     ```bash
     cd backend
     ```
   - Install dependencies:
     ```bash
     pip install -r requirements.txt
     ```
   - Set up environment variables for Spotify API credentials:
     ```bash
     export SPOTIFY_CLIENT_ID='your_client_id'
     export SPOTIFY_CLIENT_SECRET='your_client_secret'
     ```
   - Run migrations:
     ```bash
     python manage.py migrate
     ```
   - Start the server:
     ```bash
     python manage.py runserver
     ```

3. **Frontend Setup**:
   - Navigate to the frontend directory:
     ```bash
     cd frontend
     ```
   - Install dependencies:
     ```bash
     npm install
     ```
   - Start the development server:
     ```bash
     npm start
     ```

## Usage

- **Search for Albums**: Use the search bar to find albums and add them to your favorites or lists.
- **Create Lists**: Organize albums into custom lists.
- **Write Reviews**: Share your thoughts on albums with the community.
- **Explore**: Discover new music through trending albums and user recommendations.

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License.

## Contact

For questions or feedback, please contact [swd7104@gmail.com].
