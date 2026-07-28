import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private initialized = false;

  onModuleInit() {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    if (this.initialized) {
      return;
    }

    try {
      // Check if Firebase is already initialized (for hot-reload scenarios)
      if ((admin.apps as any).length > 0) {
        this.logger.log('Firebase Admin already initialized');
        this.initialized = true;
        return;
      }

      // Use applicationDefault credentials - automatically picks up:
      // - GOOGLE_APPLICATION_CREDENTIALS env var
      // - Well-known file locations
      // - GCE/GAE metadata server (when deployed)
      const credential = admin.credential.applicationDefault();

      admin.initializeApp({
        credential,
      });

      this.initialized = true;
      this.logger.log('Firebase Admin initialized successfully');
    } catch (error) {
      // Log warning but don't crash - Firebase is optional for Google OAuth
      this.logger.warn(
        'Firebase Admin not initialized (optional for Google OAuth):',
        error,
      );
    }
  }

  /**
   * Verify a Firebase ID token (typically from Google OAuth)
   * Returns the decoded token with user information
   */
  async verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
    if (!this.initialized) {
      throw new Error(
        'Firebase Admin is not initialized. Please check environment variables.',
      );
    }

    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      return decodedToken;
    } catch (error) {
      this.logger.error('Failed to verify Firebase ID token:', error);
      throw new Error('Invalid Firebase ID token');
    }
  }

  /**
   * Get user by Firebase UID
   */
  async getUserByFirebaseUid(
    uid: string,
  ): Promise<admin.auth.UserRecord | null> {
    if (!this.initialized) {
      throw new Error('Firebase Admin is not initialized.');
    }

    try {
      const userRecord = await admin.auth().getUser(uid);
      return userRecord;
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get user by email (from Firebase)
   */
  async getUserByEmail(email: string): Promise<admin.auth.UserRecord | null> {
    if (!this.initialized) {
      throw new Error('Firebase Admin is not initialized.');
    }

    try {
      const userRecord = await admin.auth().getUserByEmail(email);
      return userRecord;
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Create a Firebase user (for linking existing RIEC users to Firebase)
   * Note: Usually Firebase users are created by client-side sign-in. This is for special cases.
   */
  async createUser(
    email: string,
    password?: string,
  ): Promise<admin.auth.UserRecord> {
    if (!this.initialized) {
      throw new Error('Firebase Admin is not initialized.');
    }

    try {
      const userRecord = await admin.auth().createUser({
        email,
        password,
        emailVerified: true, // Since we come from Google OAuth, email is verified
      });
      return userRecord;
    } catch (error) {
      this.logger.error('Failed to create Firebase user:', error);
      throw error;
    }
  }
}
