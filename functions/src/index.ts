/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import * as logger from "firebase-functions/logger";
import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK
if (admin.apps.length === 0) {
  admin.initializeApp();
}

/**
 * Generates a mathematical model based on a problem description.
 *
 * @param {string} data.problemDescription - The description of the problem.
 * @returns {Promise<{status: string, description: string}>} A success message with the received description.
 * @throws HttpsError - Throws an error if problemDescription is not provided.
 */
export const generateMathematicalModel = onCall<{problemDescription: string}>(
  (request) => {
    logger.info("generateMathematicalModel called", {structuredData: true});

    const problemDescription = request.data.problemDescription;

    if (!problemDescription || typeof problemDescription !== "string") {
      logger.error(
        "generateMathematicalModel: problemDescription is missing or not a string.",
        request.data
      );
      throw new HttpsError(
        "invalid-argument",
        "The function must be called with " +
          "one argument 'problemDescription' containing the problem description."
      );
    }

    logger.info(
      "Received problem description:",
      problemDescription
    );

    // For now, just log and return a success message.
    // AI model integration will go here in the future.
    return {
      status: "received",
      description: problemDescription,
    };
  }
);
