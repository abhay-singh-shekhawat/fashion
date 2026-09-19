# Fashion App - Backend API Documentation

## Base URL
```
https://fashion.sytes.net/api/v1
```

---

## Table of Contents
1. [Authentication Routes](#authentication-routes)
2. [Profile Routes](#profile-routes)
3. [Wardrobe Routes](#wardrobe-routes)
4. [Scan Routes](#scan-routes)
5. [Chat Agent Routes](#chat-agent-routes)
6. [Suggestion Routes](#suggestion-routes)
7. [Progress Routes](#progress-routes)
8. [Outfit Rating Routes](#outfit-rating-routes)
9. [Socket.IO Events](#socketio-events)

---

## Authentication Routes

### 1. Register User
**Endpoint:** `POST /user/register`

**Purpose:** Create a new user account with email and password

**Required Parameters (Body):**
| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | string | User's full name |
| `email` | string | User's email (must be unique) |
| `password` | string | User's password (will be hashed) |

**Response (201 Created):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Codes:**
- `400` - Email already in use / Missing required fields
- `500` - Server error during registration

**Notes:**
- Automatically creates empty BodyProfile and UserProgress documents
- Returns JWT accessToken (expires in 1 hour)
- Sets refreshToken in httpOnly cookie (expires in 7 days)

---

### 2. Login User
**Endpoint:** `POST /user/login`

**Purpose:** Authenticate existing user with email and password

**Required Parameters (Body):**
| Parameter | Type | Description |
|-----------|------|-------------|
| `email` | string | User's email |
| `password` | string | User's password |

**Response (200 OK):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Codes:**
- `401` - Invalid email or password
- `500` - Server error during login

**Authentication Required:** No

---

## Profile Routes

### 3. Create or Update User Profile
**Endpoint:** `POST /profile/upload/profile`
**Endpoint:** `PUT /profile/update/profile`

**Purpose:** Create or update user's body profile (height, weight, age, gender, skin tone)

**Authentication Required:** Yes (Bearer Token)

**Required Parameters (Body):**
| Parameter | Type | Enum Values | Description |
|-----------|------|-------------|-------------|
| `heightCm` | number | 100-250 | Height in centimeters |
| `weightKg` | number | 30-200 | Weight in kilograms |
| `age` | number | 12-100 | User's age |
| `gender` | string | `male`, `female`, `other`, `prefer_not_to_say` | User's gender |
| `skinTone` | string | `warm`, `cool`, `neutral`, `olive`, `unknown` | Skin tone type |

**Response (200 OK):**
```json
{
  "message": "Profile saved successfully",
  "profile": {
    "_id": "507f1f77bcf86cd799439012",
    "userId": "507f1f77bcf86cd799439011",
    "heightCm": 175,
    "weightKg": 70,
    "age": 28,
    "gender": "male",
    "skinTone": "warm",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

**Error Codes:**
- `401` - Unauthorized / Invalid token
- `404` - User not found
- `400` - Validation error (invalid field values)

---

### 4. Get User Profile
**Endpoint:** `GET /profile/get/profile`

**Purpose:** Retrieve the current user's body profile

**Authentication Required:** Yes (Bearer Token)

**Response (200 OK):**
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "userId": "507f1f77bcf86cd799439011",
  "heightCm": 175,
  "weightKg": 70,
  "age": 28,
  "gender": "male",
  "skinTone": "warm",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

**Error Codes:**
- `401` - Unauthorized / Invalid token
- `404` - Profile not found

---

## Wardrobe Routes

### 5. Add Clothing Item
**Endpoint:** `POST /wardrobe/add/item`

**Purpose:** Add a new clothing item to user's wardrobe

**Authentication Required:** Yes (Bearer Token)

**Required Parameters (Body):**
| Parameter | Type | Enum Values | Description |
|-----------|------|-------------|-------------|
| `name` | string | - | Item name (e.g., "Blue T-shirt") |
| `category` | string | `top`, `bottom`, `outerwear`, `footwear`, `accessory`, `other` | Type of clothing |
| `color` | string | - | Color of item (optional, default: "unknown") |
| `formality` | string | `casual`, `smart_casual`, `formal`, `business`, `party`, `sporty`, `traditional`, `unknown` | Formality level (optional) |

**Response (201 Created):**
```json
{
  "message": "Item added to wardrobe",
  "item": {
    "_id": "507f1f77bcf86cd799439013",
    "userId": "507f1f77bcf86cd799439011",
    "name": "Blue T-shirt",
    "category": "top",
    "color": "blue",
    "formality": "casual",
    "createdAt": "2024-01-15T10:35:00Z"
  }
}
```

**Error Codes:**
- `400` - Missing required fields
- `401` - Unauthorized

**Rewards:** 10 points awarded for adding item

---

### 6. Get User's Wardrobe
**Endpoint:** `GET /wardrobe/get/wardrobe`

**Purpose:** Retrieve all clothing items in user's wardrobe

**Authentication Required:** Yes (Bearer Token)

**Response (200 OK):**
```json
{
  "items": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "userId": "507f1f77bcf86cd799439011",
      "name": "Blue T-shirt",
      "category": "top",
      "color": "blue",
      "formality": "casual",
      "createdAt": "2024-01-15T10:35:00Z"
    },
    {
      "_id": "507f1f77bcf86cd799439014",
      "userId": "507f1f77bcf86cd799439011",
      "name": "Black Jeans",
      "category": "bottom",
      "color": "black",
      "formality": "casual",
      "createdAt": "2024-01-15T10:36:00Z"
    }
  ]
}
```

**Caching:** Results cached for 5 minutes

**Error Codes:**
- `400` - Missing userId
- `401` - Unauthorized

---

### Remove Clothing Item
**Endpoint:** `DELETE /wardrobe/remove/item/:id`

**Purpose:** Remove one piece from the user's wardrobe

**Authentication Required:** Yes (Bearer Token)

**Response (200 OK):**
```json
{
  "success": true,
  "deleted": "507f1f77bcf86cd799439014"
}
```

**Notes:**
- Busts the 5-minute wardrobe/suggestion caches, so the item disappears immediately.
- The Cloudinary asset is destroyed only when no other item still references it — one
  scanned photo can hold several pieces that share a single upload.

**Error Codes:**
- `401` - Unauthorized
- `404` - Item not found (also returned for a malformed id)

---

### 7. Get Wardrobe Suggestions (Daily Outfit)
**Endpoint:** `GET /wardrobe/get/suggestions`

**Purpose:** Get AI-powered outfit suggestion based on user's wardrobe and weather

**Authentication Required:** Yes (Bearer Token)

**Response (200 OK):**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "fullOutfit": {
    "top": {
      "id": "507f1f77bcf86cd799439013",
      "name": "Blue T-shirt",
      "category": "top",
      "color": "blue",
      "formality": "casual",
      "image": "https://cloudinary.com/..."
    },
    "bottom": {
      "id": "507f1f77bcf86cd799439014",
      "name": "Black Jeans",
      "category": "bottom",
      "color": "black",
      "formality": "casual",
      "image": "https://cloudinary.com/..."
    }
  },
  "suggestion": {
    "outfit": "Blue T-shirt (blue) + Black Jeans (black)",
    "weatherFit": "Good for mild (~22°C)",
    "note": "AI-selected outfit"
  }
}
```

**Error Codes:**
- `404` - Profile not found or wardrobe empty
- `401` - Unauthorized

**Caching:** Results cached for 5 minutes

---

### 8. Get Occasion-Based Suggestion
**Endpoint:** `GET /wardrobe/api/suggestions/occasion`

**Purpose:** Get outfit suggestions for a specific occasion (office, party, gym, etc.)

**Authentication Required:** Yes (Bearer Token)

**Query Parameters:**
| Parameter | Type | Required | Values |
|-----------|------|----------|--------|
| `occasion` | string | No | Any occasion (default: "casual") |
| `refresh` | string | No | `1` to bypass the 5-minute cache and return a different combination |

**Notes:**
- The pick is assembled from the user's own closet and ranked by the stylist model.
- `refresh=1` never hands back the combination it is replacing: when the model lands on the
  same outfit again, the next-ranked candidate is served instead. This is what the app's
  "Surprise me" mode calls.

**Response (200 OK):**
```json
{
  "suggestion": {
    "outfit": "Formal Blazer (navy) + Dress Pants (black)",
    "weatherFit": "Good for mild (~22°C)",
    "occasion": "office",
    "note": "Professional look suitable for workplace"
  }
}
```

**Error Codes:**
- `404` - Profile not found
- `401` - Unauthorized

---

## Scan Routes

### 9. Scan Outfit
**Endpoint:** `POST /scan/outfit`

**Purpose:** Upload an image to scan and detect clothing items (real-time progress via WebSocket)

**Authentication Required:** Yes (Bearer Token)

**Required Parameters (FormData):**
| Parameter | Type | Description |
|-----------|------|-------------|
| `image` | file | Image file (jpg, png, etc.) |

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Scan job queued successfully. Processing in background...",
  "jobId": "scan_507f1f77bcf86cd799439011_1705315200000",
  "uploadedImageUrl": "https://res.cloudinary.com/...",
  "publicId": "fashion/scan/scan_507f1f77bcf86cd799439011_1705315200000",
  "note": "You will be notified when processing is complete. Real YOLOv8 coming soon."
}
```

**WebSocket Events Emitted:**
- `scan:start` - Scan started
- `scan:progress` - Progress update (30%, 50%, etc.)
- `scan:items:detected` - Items detected in image
- `scan:complete` - Scan job complete
- `scan:error` - Error during processing

**Error Codes:**
- `400` - No image uploaded
- `401` - Unauthorized
- `404` - Profile not found
- `413` - Photo larger than the 10MB upload limit

**Rejection:** a photo with no clothing in it is refused by the AI check inside the worker —
the request still returns `202`, then `scan:error` carries "no clothing found". Nothing is
saved to the closet and no points are awarded.

**Rewards:** 8 points awarded for uploading scan

---

## Chat Agent Routes

### 10. Agentic Chat
**Endpoint:** `POST /agent/chat`

**Purpose:** Chat with AI fashion stylist that can access wardrobe, profile, and weather data

**Authentication Required:** Yes (Bearer Token)

**Required Parameters (Body):**
| Parameter | Type | Description |
|-----------|------|-------------|
| `userId` | string | User's ID |
| `message` | string | Chat message (min 3 characters) |

**Optional Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `image` | file | Optional image for context |

**Response (200 OK):**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "reply": {
    "message": "That's a great outfit choice! The blue complements your warm skin tone perfectly..."
  },
  "success": true
}
```

**WebSocket Events Emitted:**
- `chat:start` - Chat started
- `chat:typing` - Bot is typing
- `chat:response:chunk` - Response chunk (word by word streaming)
- `chat:response:complete` - Full response complete
- `chat:error` - Error occurred

**AI Tools Available (Automatic):**
- Get wardrobe items
- Get daily recommendations
- Get occasion suggestions
- Get shopping suggestions
- Get user progress

**Error Codes:**
- `400` - Missing userId or message
- `401` - Unauthorized
- `500` - AI generation error

---

## Suggestion Routes

### 11. Get Occasion Ideas (not from the closet)
**Endpoint:** `GET /suggestion/get/occasion/suggestions`

**Purpose:** Outfit ideas for an occasion written from the user's body profile, the occasion and
today's weather. Deliberately **not** assembled from the wardrobe — this is the inspiration mode,
the counterpart to `GET /wardrobe/api/suggestions/occasion`.

**Authentication Required:** Yes (Bearer Token)

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `occasion` | string | No | Occasion type (default: "casual"). Must be one of the occasions the app offers |
| `refresh` | string | No | `1` to bypass the 5-minute cache and write a different set |

**Response (200 OK):**
```json
{
  "occasion": "office",
  "ideas": [
    {
      "title": "Quiet authority",
      "pieces": ["Navy wool overshirt", "Ecru pleated trousers", "Brown leather derbies"],
      "why": "Warm neutrals flatter your tone and read formal without a suit."
    }
  ],
  "weatherNote": "~24°C – mild",
  "source": "ai"
}
```

**Notes:**
- `source` is `ai` when the stylist model wrote the set, and `rules` when the rule-based generator
  answered instead (model unavailable). The rules path reuses `src/utils/offlineSuggestion.js`,
  which reads gender, skin tone and weather only.
- Ideas are never filtered by what the user owns and never mention the wardrobe.

**Error Codes:**
- `400` - Invalid occasion
- `401` - Unauthorized

**Caching:** per user and occasion for 5 minutes; `refresh=1` skips the read.

**Rewards:** none. The set can be re-rolled freely, so awarding points per call would be farmable.
Points stay on the paths that build the wardrobe: adding, scanning, rating, and styling from the
closet.

---

### 12. Get Daily Recommendations
**Endpoint:** `GET /suggestion/get/daily/recommendations`

**Purpose:** Get personalized daily outfit recommendation based on weather and user profile

**Authentication Required:** Yes (Bearer Token)

**Response (200 OK):**
```json
{
  "responseData": {
    "userId": "507f1f77bcf86cd799439011",
    "date": "01/15/2024",
    "temperature": 22,
    "weatherFeel": "mild",
    "recommendation": {
      "outfit": "Blue T-shirt (blue) + Jeans (black)",
      "source": "ai",
      "message": "For 22°C, try: Blue T-shirt (blue) + Jeans (black)",
      "weatherSource": "ai"
    }
  },
  "note": "AI-powered recommendation"
}
```

**Error Codes:**
- `401` - Unauthorized
- `404` - Profile not found

**Rewards:** 5 points awarded

**Caching:** Results cached for 30 minutes

---

### 13. Get Shopping Suggestions
**Endpoint:** `GET /suggestion/get/shopping`

**Purpose:** Get smart shopping suggestions based on wardrobe gaps and user profile

**Authentication Required:** Yes (Bearer Token)

**Response (200 OK):**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "wardrobeSize": 15,
  "gaps": [
    "Need more formal wear for office occasions",
    "Missing summer-appropriate items",
    "Consider adding neutral basics"
  ],
  "recommendations": [
    "Navy Blazer - Professional look for office",
    "White Dress Shirt - Versatile formal piece",
    "Light Summer Dress - Comfortable for hot days"
  ]
}
```

**Error Codes:**
- `401` - Unauthorized
- `404` - Profile not found

---

## Progress Routes

### 14. Get User Progress
**Endpoint:** `GET /progress/get/progress`

**Purpose:** Retrieve the current user's progress, level, points, and streak

**Authentication Required:** Yes (Bearer Token)

**Response (200 OK):**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "level": 2,
  "totalPoints": 150,
  "pointsToNextLevel": 50,
  "totalOutfitsSuggested": 12,
  "totalWardrobeItems": 15,
  "currentStreak": 3,
  "lastSuggestionDate": "2024-01-15T10:30:00Z",
  "motivationalMessage": "You're becoming a style pro!",
  "badge": "Style Enthusiast"
}
```

**Error Codes:**
- `400` - Missing userId
- `401` - Unauthorized

---

## Outfit Rating Routes

### 15. Rate Outfit (Image Scan)
**Endpoint:** `POST /outfit/rate`

**Purpose:** Upload an outfit image URL to get a detailed score, weather suitability, skin tone fit, and improvement tips

**Authentication Required:** Yes (Bearer Token)

**Required Parameters (Body):**
| Parameter | Type | Description |
|-----------|------|-------------|
| `imageUrl` | string | URL of the outfit image to scan and rate |

**Optional Parameters (Body):**
| Parameter | Type | Description |
|-----------|------|-------------|
| `occasion` | string | Occasion context (default: "casual") |
| `detailedFeedback` | boolean | Whether to generate detailed AI feedback (default: false) |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "score": 85,
    "message": "Great outfit!",
    "breakdown": {
      "colorHarmony": 80,
      "skinToneFit": 82,
      "weatherSuitability": 75,
      "formalityMatch": 90
    },
    "scannedOutfit": {
      "items": [
        { "type": "t-shirt", "color": "blue", "confidence": 0.92 }
      ],
      "itemCount": 1,
      "colors": ["blue"],
      "formalityLevel": "casual",
      "overallStyle": "casual"
    },
    "weather": {
      "temperature": 22,
      "condition": "clear",
      "isDay": true
    },
    "improvementTips": {
      "tips": ["Consider adding...", "Try pairing with..."],
      "mode": "quick",
      "model": "gemini"
    },
    "metadata": {
      "userId": "507f1f77bcf86cd799439011",
      "scanConfidence": 0.85,
      "scannedAt": "2024-01-15T10:30:00Z",
      "imageHash": "a1b2c3d4"
    }
  }
}
```

**WebSocket Events Emitted:**
- `rating:start` - Rating started
- `rating:weather:done` - Weather suitability calculated
- `rating:score:done` - Outfit score calculated
- `rating:tips:chunk` - Improvement tips streaming
- `rating:complete` - Rating complete
- `rating:error` - Error during rating

**Error Codes:**
- `400` - Missing image upload / imageUrl, or the link could not be downloaded
- `401` - Unauthorized
- `404` - User not found
- `413` - Photo larger than the 10MB upload limit
- `500` - Score calculation error

**Rejection / limits:**
- Photos without clothing (posters, flyers, screenshots) are refused by the AI check inside
  the worker, so they return `202` first and then arrive as `rating:error` with a message
  saying no clothing was found. Nothing is added to history and no points are awarded.
- The web app resizes picked photos to 1600px in the browser, so the 10MB cap is only
  reached by API clients that upload originals.

**Rewards:** 5-10 points awarded based on score

---

### 16. Rate Saved Outfit
**Endpoint:** `POST /outfit/rate-saved`

**Purpose:** Rate an outfit composed of saved wardrobe items and get improvement tips

**Authentication Required:** Yes (Bearer Token)

**Required Parameters (Body):**
| Parameter | Type | Description |
|-----------|------|-------------|
| `clothingItemIds` | array | Array of clothing item IDs to rate |

**Optional Parameters (Body):**
| Parameter | Type | Description |
|-----------|------|-------------|
| `occasion` | string | Occasion context (default: "casual") |
| `detailedFeedback` | boolean | Whether to generate detailed AI feedback (default: false) |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "score": 78,
    "message": "Nice outfit!",
    "breakdown": {
      "colorHarmony": 75,
      "skinToneFit": 80,
      "weatherSuitability": 70,
      "formalityMatch": 85
    },
    "outfit": {
      "itemCount": 2,
      "items": [
        { "id": "507f1f77bcf86cd799439013", "name": "Blue T-shirt", "color": "blue", "category": "top" },
        { "id": "507f1f77bcf86cd799439014", "name": "Black Jeans", "color": "black", "category": "bottom" }
      ],
      "colors": ["blue", "black"]
    },
    "weather": {
      "temperature": 22,
      "condition": "clear",
      "isDay": true
    },
    "improvementTips": {
      "tips": ["Consider adding...", "Try pairing with..."],
      "mode": "quick"
    },
    "metadata": {
      "ratedAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

**Error Codes:**
- `400` - At least one clothing item is required
- `401` - Unauthorized
- `404` - No items found

**Rewards:** 3-8 points awarded based on score

---

## Socket.IO Events

### Connection Flow

**1. Authenticate:**
```javascript
socket.emit("auth:authenticate", { token: accessToken })
```

**2. Receive Response:**
```javascript
socket.on("auth:success", (data) => {
  console.log("Connected:", data);
})
```

### Chat Events

**Send Message:**
```javascript
socket.emit("chat:message", { 
  message: "What should I wear today?",
  userId: userId 
})
```

**Receive Streaming Response:**
```javascript
socket.on("chat:response:chunk", (data) => {
  // data: { chunk: "word ", index: 0 }
  console.log(data.chunk); // Append to UI
})

socket.on("chat:response:complete", (data) => {
  // Complete message received
  // data: { fullMessage: "...", model: "gemini", tokensUsed: 150 }
})
```

### Scan Events

**Monitor Scan Progress:**
```javascript
socket.on("scan:progress", (data) => {
  // data: { percent: 50, message: "Detecting patterns..." }
  updateProgressBar(data.percent);
})

socket.on("scan:items:detected", (data) => {
  // data: { items: [...], colors: [...] }
  displayDetectedItems(data.items);
})

socket.on("scan:complete", (data) => {
  // Scan completed
  console.log("Items detected:", data.items);
})
```

### Rating Events

**Monitor Rating Calculation:**
```javascript
socket.on("rating:weather:done", (data) => {
  // data: { score: 75, temperature: 28 }
})

socket.on("rating:skintone:done", (data) => {
  // data: { score: 82, skinTone: "warm" }
})

socket.on("rating:score:done", (data) => {
  // data: { score: 85, message: "Great outfit!" }
})

socket.on("rating:tips:chunk", (data) => {
  // data: { tip: "Consider adding...", index: 0 }
  appendTip(data.tip);
})

socket.on("rating:complete", (data) => {
  // Full rating summary
  console.log("Final score:", data.score);
})
```

### Notification Events

```javascript
socket.on("notification:achievement", (data) => {
  // data: { achievement: "First Outfit Rated", points: 10 }
})

socket.on("notification:suggestion", (data) => {
  // New suggestion available
  showNotification(data.suggestion);
})
```

---

## Error Response Format

All error responses follow this format:

```json
{
  "message": "Error description",
  "success": false,
  "statusCode": 400
}
```

---

## Rate Limiting

- **Global Limit:** 100 requests per 15 minutes per IP
- **Error Response:** 429 Too Many Requests

---

## Authentication Header

For protected routes, include:
```
Authorization: Bearer <accessToken>
```

---

## Caching Strategy

| Endpoint | Cache Duration | Cache Key |
|----------|----------------|-----------|
| Get Wardrobe | 5 minutes | `wardrobe:{userId}` |
| Wardrobe Suggestions | 5 minutes | `wardrobe-suggestions:{userId}` |
| Daily Recommendations | 30 minutes | `daily_rec:{userId}` |
| Occasion Suggestions | 30 minutes | `occasion_sug:{userId}` |
| Shopping Suggestions | Varies | N/A |

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Total API Endpoints | 17 |
| Authentication Endpoints | 2 |
| Profile Endpoints | 2 |
| Wardrobe Endpoints | 4 |
| Scan Endpoints | 1 |
| Chat Endpoints | 1 |
| Suggestion Endpoints | 3 |
| Progress Endpoints | 1 |
| Outfit Rating Endpoints | 2 |
| Protected Routes | 15 |
| Public Routes | 2 |

