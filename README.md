[![Maintained with Bun](https://img.shields.io/badge/maintained%20with-bun-ac98ff.svg?style=for-the-badge&logo=bun)](https://bun.sh/)![Size](https://img.shields.io/github/repo-size/chloefrfr/ChronosPrivate?label=Size&style=for-the-badge)

![Banner](https://cdn2.unrealengine.com/13br-galaxycup-newsheader-1900x600-1900x600-482668392.jpg)

**Surge Backend**

A modern backend implementation for Fortnite, focused on performance and scalability.

## Features

### Core Features
- ✅ XMPP Support (TCP & WebSocket)
- ✅ Matchmaker System
- ✅ Party System (V1 & V2)
- ✅ Authentication with Permissions
- ✅ Profile Management
- ✅ Automated Session Management
- ✅ Security System

### Game Features
- ✅ VBucks Rewards System
  - Kill rewards
  - Victory rewards
  - Customizable amounts
- ✅ Auto-Shop System
  - Daily rotations
  - Configurable items
  - Automated updates
- ✅ Leaderboards
  - Global rankings
  - Stats tracking
  - Real-time updates
- ✅ Arena Mode
  - Point system
  - Division rankings
  - Competitive matchmaking
- ✅ Tournament System
  - Custom tournaments
  - Scoring system
  - Prize distribution

### Save the World Features
- ✅ Mission System
  - Dynamic mission generation
  - Various mission types
  - Rotating mission alerts
  - V-Bucks missions
  - Custom modifiers
- ✅ Hero Management
  - Hero leveling
  - Evolution system
  - Perk unlocks
  - Hero loadouts
- ✅ Survivor Squads
  - Squad bonuses
  - Personality matching
  - Power level calculation
  - Auto-fill optimization
- ✅ Rewards System
  - Mission rewards
  - Daily rewards
  - Quest rewards
  - V-Bucks missions
- ✅ Storyline System
  - Quest chains
  - Character dialogue
  - Voice acting support
  - Zone progression
  - Multiple quest types
  - Dynamic requirements
  - Reward system integration

## API Documentation

### Authentication
- POST `/api/auth/login` - Login and get session token
- POST `/api/auth/register` - Register new account

### Profile
- GET `/api/profile` - Get user profile
- PUT `/api/profile` - Update profile

### Stats
- GET `/api/system/stats` - Get system statistics
- GET `/api/leaderboard` - Get global leaderboard

### Shop
- GET `/api/shop/current` - Get current shop items
- POST `/api/shop/purchase` - Purchase item

### Arena
- GET `/api/arena/stats` - Get arena statistics
- GET `/api/arena/division` - Get current division

### Tournaments
- GET `/api/tournaments` - List active tournaments
- POST `/api/tournaments/register` - Register for tournament

### Save the World
- GET `/api/stw/missions/current` - Get current missions
- POST `/api/stw/missions/:missionId/complete` - Complete mission
- GET `/api/stw/storyline/current` - Get current quest
- GET `/api/stw/storyline/progress` - Get zone progress
- POST `/api/stw/storyline/progress` - Update quest progress

## Security

The backend implements several security measures:
- Automated session management
- Token-based authentication
- Request validation
- Rate limiting
- Session cleanup

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Thanks to all contributors
- Inspired by various Fortnite backend implementations