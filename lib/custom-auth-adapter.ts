import { Adapter, AdapterUser, AdapterAccount, AdapterSession, VerificationToken } from 'next-auth/adapters';
import type { Awaitable } from 'next-auth';
import { neon } from '@neondatabase/serverless';
import { randomUUID } from 'crypto';
import type { NeonQueryFunction } from '@neondatabase/serverless';

/**
 * This file implements a fully custom NextAuth.js adapter for PostgreSQL
 * using the Neon serverless driver. It handles the plural "users" table
 * and adds emailVerified: null to satisfy NextAuth.js requirements
 * without changing the database schema.
 */

// Define helper types for better type safety with Neon
type NeonResult<T = any> = T[];

// Helper function to safely access query results
function safeGetResult<T>(result: unknown): T[] | null {
  if (!result || !Array.isArray(result) || result.length === 0) {
    return null;
  }
  return result as T[];
}

// Helper function to extract the first item from a result safely
function getFirstResult<T>(result: unknown): T | null {
  const items = safeGetResult<T>(result);
  return items && items.length > 0 ? items[0] : null;
}

// Create a direct connection to Neon for raw SQL queries
const rawDb = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;

/**
 * Creates a fully custom adapter that works with existing database tables
 */
/**
 * Custom adapter for NextAuth.js that works with our specific database schema.
 * This connects to our existing users table (plural) rather than the user table (singular)
 * expected by NextAuth, and handles the absence of the emailVerified column.
 */
export function createCustomAdapter(): Adapter {
  return {
    // User methods
    async createUser(user: Omit<AdapterUser, "id">) {
      try {
        if (!rawDb) {
          throw new Error("Database connection not available");
        }
        
        const result = await rawDb`
          INSERT INTO "users" (name, email, image)
          VALUES (${user.name}, ${user.email}, ${user.image})
          RETURNING id, name, email, image
        `;
        
        const savedUser = getFirstResult<{id: string, name: string, email: string, image: string}>(result);
        
        if (!savedUser) {
          throw new Error("Failed to create user");
        }
        
        const newUser: AdapterUser = {
          id: savedUser.id,
          name: savedUser.name,
          email: savedUser.email,
          image: savedUser.image,
          emailVerified: null,
        };
        return newUser;
      } catch (error) {
        console.error("[next-auth][error][custom-adapter-createUser]", error);
        throw error;
      }
    },

    // Override getUserByAccount to handle the missing emailVerified column
    async getUserByAccount(providerAccountId: { provider: string, providerAccountId: string }) {
      try {
        if (!rawDb) {
          throw new Error("Database connection not available");
        }
        
        // Use raw SQL to avoid the missing column issue
        const accountResult = await rawDb`
          SELECT "userId" 
          FROM account 
          WHERE provider = ${providerAccountId.provider} 
          AND "providerAccountId" = ${providerAccountId.providerAccountId}
          LIMIT 1
        `;
        
        const account = getFirstResult<{userId: string}>(accountResult);
        if (!account) {
          return null;
        }
        
        const userResult = await rawDb`
          SELECT id, name, email, image 
          FROM "users" 
          WHERE id = ${account.userId} 
          LIMIT 1
        `;
        
        if (!userResult || userResult.length === 0) {
          return null;
        }
        
        // Return the user with an empty emailVerified field
        const userData = userResult[0];
        const user: AdapterUser = {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          image: userData.image,
          emailVerified: null,
        };
        return user;
      } catch (error) {
        console.error("[next-auth][error][custom-adapter]", error);
        return null;
      }
    },
    // Override other methods as needed to handle the missing emailVerified column
    async getUser(id: string): Promise<AdapterUser | null> {
      try {
        if (!rawDb) {
          throw new Error("Database connection not available");
        }
        
        // Get user by ID from the users table (plural)
        const result = await rawDb`
          SELECT id, name, email, image 
          FROM "users" 
          WHERE id = ${id} 
          LIMIT 1
        `;
        
        if (!result || result.length === 0) {
          return null;
        }
        
        const userData = getFirstResult<{id: string, name: string, email: string, image: string}>(result);
        if (!userData) {
          return null;
        }

        const user: AdapterUser = {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          image: userData.image,
          emailVerified: null,
        };
        return user;
      } catch (error) {
        console.error("[next-auth][error][custom-adapter]", error);
        return null;
      }
    },
    async getUserByEmail(email: string): Promise<AdapterUser | null> {
      try {
        if (!rawDb) {
          throw new Error("Database connection not available");
        }
        
        // Get user by email from the users table (plural)
        const result = await rawDb`
          SELECT id, name, email, image 
          FROM "users" 
          WHERE email = ${email} 
          LIMIT 1
        `;
        
        if (!result || result.length === 0) {
          return null;
        }
        
        const userData = getFirstResult<{id: string, name: string, email: string, image: string}>(result);
        if (!userData) {
          return null;
        }

        const user: AdapterUser = {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          image: userData.image,
          emailVerified: null,
        };
        return user;
      } catch (error) {
        console.error("[next-auth][error][custom-adapter]", error);
        return null;
      }
    },
    
    // Account methods
    async linkAccount(account: AdapterAccount): Promise<AdapterAccount> {
      try {
        if (!rawDb) {
          throw new Error("Database connection not available");
        }
        
        const accountToLink = { ...account }; // Create a copy to avoid variable reference before declaration
        
        // Insert the account with all fields except id (which doesn't exist in the schema)
        const result = await rawDb`
          INSERT INTO account (
            "userId",
            type,
            provider,
            "providerAccountId",
            refresh_token,
            access_token,
            expires_at,
            token_type,
            scope,
            id_token,
            session_state
          )
          VALUES (
            ${accountToLink.userId},
            ${accountToLink.type},
            ${accountToLink.provider},
            ${accountToLink.providerAccountId},
            ${accountToLink.refresh_token || null},
            ${accountToLink.access_token || null},
            ${accountToLink.expires_at || null},
            ${accountToLink.token_type || null},
            ${accountToLink.scope || null},
            ${accountToLink.id_token || null},
            ${accountToLink.session_state || null}
          )
          RETURNING *
        `;
        
        const linkedAccount = getFirstResult<Record<string, any>>(result);
        if (!linkedAccount) {
          throw new Error("Failed to link account");
        }
        return linkedAccount as AdapterAccount;
      } catch (error) {
        console.error("[next-auth][error][custom-adapter-linkAccount]", error);
        throw error;
      }
    },
    
    async unlinkAccount({ provider, providerAccountId }): Promise<void> {
      try {
        if (!rawDb) {
          throw new Error("Database connection not available");
        }
        
        // Find the account by provider and providerAccountId
        const accountResult = await rawDb`
          SELECT "userId" 
          FROM account 
          WHERE 
            provider = ${provider} AND 
            "providerAccountId" = ${providerAccountId} 
          LIMIT 1
        `;
        
        const account = getFirstResult<{userId: string}>(accountResult);
        if (!account) {
          return;
        }
        
        // Delete the account
        await rawDb`
          DELETE FROM account 
          WHERE provider = ${provider} 
          AND "providerAccountId" = ${providerAccountId}
        `;
      } catch (error) {
        console.error("[next-auth][error][custom-adapter-unlinkAccount]", error);
        throw error;
      }
    },
    
    // Session methods
    async createSession(sessionData: { sessionToken: string; userId: string; expires: Date }): Promise<AdapterSession> {
      try {
        if (!rawDb) {
          throw new Error("Database connection not available");
        }
        
        // Ensure we're using a valid JavaScript Date object
        const expiresDate = new Date(sessionData.expires);
        
        // Create the session with properly quoted column names
        const result = await rawDb`
          INSERT INTO session (
            "sessionToken", 
            "userId", 
            expires
          )
          VALUES (
            ${sessionData.sessionToken},
            ${sessionData.userId},
            ${expiresDate}
          )
          RETURNING *
        `;
        
        const tokens = safeGetResult<Record<string, any>>(result);
        if (!tokens) {
          throw new Error("Failed to create session");
        }
        
        // Ensure expires is a proper Date object
        return {
          sessionToken: tokens[0].sessionToken,
          userId: tokens[0].userId,
          expires: new Date(tokens[0].expires)
        };
      } catch (error) {
        console.error("[next-auth][error][custom-adapter-createSession]", error);
        throw error;
      }
    },
    
    async getSessionAndUser(sessionToken: string): Promise<{ session: AdapterSession; user: AdapterUser } | null> {
      try {
        if (!rawDb) {
          throw new Error("Database connection not available");
        }
        
        // Find the session by token
        const sessionResult = await rawDb`
          SELECT * FROM session
          WHERE "sessionToken" = ${sessionToken}
          LIMIT 1
        `;
        
        const sessionData = getFirstResult<{sessionToken: string, userId: string, expires: Date}>(sessionResult);
        if (!sessionData) {
          return null;
        }
        
        // Find the associated user
        const userResult = await rawDb`
          SELECT id, name, email, image 
          FROM "users" 
          WHERE id = ${sessionData.userId} 
          LIMIT 1
        `;
        
        // Use our helper to safely get user data
        const userData = getFirstResult<{id: string, name: string, email: string, image: string}>(userResult);
        if (!userData) {
          return null;
        }
        
        // Create properly typed session and user objects
        const session: AdapterSession = {
          sessionToken: sessionData.sessionToken,
          userId: sessionData.userId,
          expires: new Date(sessionData.expires) // Ensure proper Date object
        };
        
        const user: AdapterUser = {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          image: userData.image,
          emailVerified: null,
        };
        
        return { session, user };
      } catch (error) {
        console.error("[next-auth][error][custom-adapter-getSessionAndUser]", error);
        return null;
      }
    },
    
    async updateSession(sessionData: Partial<AdapterSession> & Pick<AdapterSession, 'sessionToken'>): Promise<AdapterSession | null> {
      try {
        if (!rawDb) {
          throw new Error("Database connection not available");
        }
        
        // Ensure we're using a valid JavaScript Date object
        const expiresDate = sessionData.expires ? new Date(sessionData.expires) : undefined;
        
        // Update the session with properly quoted column names
        const result = await rawDb`
          UPDATE session
          SET
            expires = ${expiresDate}
          WHERE "sessionToken" = ${sessionData.sessionToken}
          RETURNING *
        `;
        
        const sessionRecord = getFirstResult<Record<string, any>>(result);
        if (!sessionRecord) {
          return null;
        }
        
        // Return with properly formatted Date
        return {
          sessionToken: sessionRecord.sessionToken,
          userId: sessionRecord.userId,
          expires: new Date(sessionRecord.expires)
        };
      } catch (error) {
        console.error("[next-auth][error][custom-adapter-updateSession]", error);
        return null;
      }
    },
    
    async deleteSession(sessionToken: string): Promise<void> {
      try {
        if (!rawDb) {
          throw new Error("Database connection not available");
        }
        
        // Delete the session with properly quoted column name
        await rawDb`
          DELETE FROM session
          WHERE "sessionToken" = ${sessionToken}
        `;
      } catch (error) {
        console.error("[next-auth][error][custom-adapter-deleteSession]", error);
      }
    },
    
    // User methods
    // This method must always return a non-null AdapterUser
    async updateUser(user: Partial<AdapterUser> & { id: string }): Promise<AdapterUser> {
      try {
        if (!rawDb) {
          throw new Error("Database connection not available");
        }
        
        const result = await rawDb`
          UPDATE users 
          SET 
            name = ${user.name || null},
            email = ${user.email || null},
            image = ${user.image || null},
            updated_at = NOW()
          WHERE id = ${user.id}
          RETURNING id, name, email, image
        `;
        
        const userData = getFirstResult<{id: string, name: string, email: string, image: string}>(result);
        
        // If no users found, return a default user object with the data we tried to update
        // This is to satisfy NextAuth.js which expects updateUser to always return a user
        if (!userData) {
          return {
            id: user.id,
            name: user.name || "",
            email: user.email || "",
            image: user.image || null,
            emailVerified: null
          };
        }
        
        const updatedUser: AdapterUser = {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          image: userData.image,
          emailVerified: null,
        };
        return updatedUser;
      } catch (error) {
        console.error("[next-auth][error][custom-adapter-updateUser]", error);
        return {
          id: user.id,
          name: user.name || "",
          email: user.email || "",
          image: user.image || null,
          emailVerified: null
        };
      }
    },
    
    async deleteUser(userId: string): Promise<void> {
      try {
        if (!rawDb) {
          throw new Error("Database connection not available");
        }
        
        // Delete all related records first with properly quoted column names
        await rawDb`DELETE FROM session WHERE "userId" = ${userId}`;
        await rawDb`DELETE FROM account WHERE "userId" = ${userId}`;
        
        // Then delete the user
        await rawDb`DELETE FROM users WHERE id = ${userId}`;
      } catch (error) {
        console.error("[next-auth][error][custom-adapter-deleteUser]", error);
        throw error;
      }
    },
    
    // Verification token
    async createVerificationToken(verificationToken: VerificationToken): Promise<VerificationToken> {
      try {
        if (!rawDb) {
          throw new Error("Database connection not available");
        }
        
        // Create an object to avoid variable reference before declaration
        const tokenData = { 
          identifier: verificationToken.identifier, 
          token: verificationToken.token, 
          expires: verificationToken.expires 
        };
        
        // Insert verification token with properly quoted column names
        const result = await rawDb`
          INSERT INTO "verificationtoken"
          (identifier, token, expires)
          VALUES (${tokenData.identifier}, ${tokenData.token}, ${tokenData.expires})
          RETURNING *
        `;
        
        const createdToken = getFirstResult<Record<string, any>>(result);
        if (!createdToken) {
          throw new Error("Failed to create verification token");
        }
        return createdToken as VerificationToken;
      } catch (error) {
        console.error("[next-auth][error][custom-adapter-createVerificationToken]", error);
        throw error;
      }
    },
    
    async useVerificationToken({ identifier, token }: { identifier: string; token: string }): Promise<VerificationToken | null> {
      try {
        if (!rawDb) {
          throw new Error("Database connection not available");
        }
        
        // Create an object to avoid variable reference before declaration
        const tokenData = { identifier, token };
        
        // Delete and return the verification token with properly quoted column names
        const result = await rawDb`
          DELETE FROM "verificationtoken"
          WHERE identifier = ${tokenData.identifier} AND token = ${tokenData.token}
          RETURNING token, expires
        `;
        
        const deletedToken = getFirstResult<Record<string, any>>(result);
        if (!deletedToken) {
          return null;
        }
        
        return deletedToken as VerificationToken;
      } catch (error) {
        console.error("[next-auth][error][custom-adapter-useVerificationToken]", error);
        return null;
      }
    },
  };
}