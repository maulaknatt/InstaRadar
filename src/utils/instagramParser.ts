export interface InstagramUser {
  username: string;
  profileUrl: string;
  timestamp?: number;
  dateJoined?: string;
}

export interface ParsingResult {
  success: boolean;
  users: InstagramUser[];
  error?: string;
}

export interface AnalysisResult {
  followersCount: number;
  followingCount: number;
  unfollowers: InstagramUser[];
  fans: InstagramUser[];
  mutuals: InstagramUser[];
}

/**
 * Parses Instagram's downloaded JSON data (followers or following).
 * Handles direct arrays (typical for followers_1.json) and key-indexed arrays (typical for following.json).
 */
export function parseInstagramJSON(jsonContent: string, fileType: 'followers' | 'following'): ParsingResult {
  try {
    const parsed = JSON.parse(jsonContent);
    const users: InstagramUser[] = [];

    // Helper to format and add a user safely
    const pushUser = (username: string, href?: string, rawTimestamp?: number) => {
      const trimmed = username.trim();
      if (!trimmed) return;
      
      const timestamp = rawTimestamp ? (rawTimestamp < 9999999999 ? rawTimestamp * 1000 : rawTimestamp) : undefined;
      const dateJoined = timestamp ? new Date(timestamp).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) : undefined;

      users.push({
        username: trimmed,
        profileUrl: href || `https://www.instagram.com/${trimmed}`,
        timestamp,
        dateJoined
      });
    };

    // Robust item extractor with multiple fallbacks
    const extractFromItem = (item: any) => {
      if (!item) return;

      // 1. Standard format: item.string_list_data[0]
      if (item.string_list_data && Array.isArray(item.string_list_data) && item.string_list_data.length > 0) {
        const data = item.string_list_data[0];
        if (data.value) {
          pushUser(data.value, data.href, data.timestamp);
          return;
        }
      }

      // 2. Direct format: item.value, item.username, item.title
      const directUsername = item.value || item.username || item.title || item.name;
      if (typeof directUsername === 'string' && directUsername.trim() !== '') {
        pushUser(directUsername, item.href || item.url, item.timestamp || item.date);
        return;
      }

      // 3. Nested format (some rare JSON export variations)
      if (typeof item === 'object') {
        for (const key of Object.keys(item)) {
          if (item[key] && typeof item[key] === 'object' && !Array.isArray(item[key])) {
            const nested = item[key];
            const val = nested.value || nested.username || nested.title;
            if (typeof val === 'string' && val.trim() !== '') {
              pushUser(val, nested.href || nested.url, nested.timestamp || nested.date);
              return;
            }
          }
        }
      }
    };

    // Process depending on structure
    if (Array.isArray(parsed)) {
      parsed.forEach(extractFromItem);
    } else if (typeof parsed === 'object' && parsed !== null) {
      let targetArray: any[] | null = null;

      // Try specific keys first
      if (fileType === 'following' && Array.isArray(parsed.relationships_following)) {
        targetArray = parsed.relationships_following;
      } else if (fileType === 'followers' && Array.isArray(parsed.relationships_followers)) {
        targetArray = parsed.relationships_followers;
      } else {
        // Fallback: Look for any property that is an array
        for (const key of Object.keys(parsed)) {
          if (Array.isArray(parsed[key])) {
            targetArray = parsed[key];
            break;
          }
        }
      }

      if (targetArray) {
        targetArray.forEach(extractFromItem);
      } else {
        return {
          success: false,
          users: [],
          error: 'Format JSON tidak cocok. Pastikan file ini diunduh langsung dari Instagram.'
        };
      }
    } else {
      return {
        success: false,
        users: [],
        error: 'Struktur JSON tidak valid.'
      };
    }

    // De-duplicate
    const seen = new Set<string>();
    const uniqueUsers = users.filter(user => {
      const lower = user.username.toLowerCase();
      if (seen.has(lower)) return false;
      seen.add(lower);
      return true;
    });

    // CRITICAL: Ensure we actually found users. If 0 users, it's an error.
    if (uniqueUsers.length === 0) {
      return {
        success: false,
        users: [],
        error: `Tidak ada data akun yang berhasil dibaca dari file ini. Pastikan Anda mengunggah file '${fileType === 'following' ? 'following.json' : 'followers_x.json'}' yang benar dalam format JSON.`
      };
    }

    return {
      success: true,
      users: uniqueUsers
    };
  } catch (err: any) {
    return {
      success: false,
      users: [],
      error: `Gagal membaca file JSON: ${err?.message || 'Error format tidak diketahui'}`
    };
  }
}

/**
 * Compares followers and following arrays to compute relationship categories.
 */
export function compareInstagramLists(followers: InstagramUser[], following: InstagramUser[]): AnalysisResult {
  const followerMap = new Map<string, InstagramUser>();
  followers.forEach(user => followerMap.set(user.username.toLowerCase(), user));

  const followingMap = new Map<string, InstagramUser>();
  following.forEach(user => followingMap.set(user.username.toLowerCase(), user));

  const unfollowers: InstagramUser[] = [];
  const fans: InstagramUser[] = [];
  const mutuals: InstagramUser[] = [];

  // Find unfollowers and mutuals
  following.forEach(user => {
    const usernameLower = user.username.toLowerCase();
    if (followerMap.has(usernameLower)) {
      mutuals.push(user);
    } else {
      unfollowers.push(user);
    }
  });

  // Find fans (followers who aren't followed back)
  followers.forEach(user => {
    const usernameLower = user.username.toLowerCase();
    if (!followingMap.has(usernameLower)) {
      fans.push(user);
    }
  });

  // Sort lists alphabetically by username for neatness
  const sortByUsername = (a: InstagramUser, b: InstagramUser) => a.username.localeCompare(b.username);
  unfollowers.sort(sortByUsername);
  fans.sort(sortByUsername);
  mutuals.sort(sortByUsername);

  return {
    followersCount: followers.length,
    followingCount: following.length,
    unfollowers,
    fans,
    mutuals
  };
}
