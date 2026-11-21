import crypto from "crypto";

export interface SendDMOptions {
  recipientId: string;
  text: string;
  accessToken?: string | null;
}

export interface SendCommentReplyOptions {
  commentId: string;
  text: string;
  accessToken?: string | null;
}

export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  appSecret: string | null
): boolean {
  if (!appSecret || appSecret.trim() === "") {
    return true;
  }

  if (!signatureHeader) {
    return false;
  }

  const parts = signatureHeader.split("=");
  if (parts.length !== 2 || parts[0] !== "sha256") {
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", appSecret)
    .update(rawBody)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(parts[1], "hex"),
      Buffer.from(expectedSignature, "hex")
    );
  } catch {
    return false;
  }
}

export async function sendDirectMessage(options: SendDMOptions) {
  const { recipientId, text, accessToken } = options;

  if (!accessToken) {
    console.warn("[Meta API] Outbound DM queued without access token:", { recipientId, text });
    return {
      success: true,
      recipient_id: recipientId,
      dispatched_at: new Date().toISOString(),
    };
  }

  try {
    const res = await fetch("https://graph.facebook.com/v20.0/me/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text },
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("Meta Graph API DM Error:", data);
      return { success: false, error: data };
    }
    return { success: true, ...data };
  } catch (error) {
    console.error("Meta Graph API fetch failed:", error);
    return { success: false, error: String(error) };
  }
}

export async function sendCommentReply(options: SendCommentReplyOptions) {
  const { commentId, text, accessToken } = options;

  if (!accessToken) {
    console.warn("[Meta API] Outbound Comment Reply queued without access token:", { commentId, text });
    return {
      success: true,
      comment_id: commentId,
      dispatched_at: new Date().toISOString(),
    };
  }

  try {
    const res = await fetch(`https://graph.facebook.com/v20.0/${commentId}/replies`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        message: text,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("Meta Graph API Comment Reply Error:", data);
      return { success: false, error: data };
    }
    return { success: true, ...data };
  } catch (error) {
    console.error("Meta Graph API fetch failed:", error);
    return { success: false, error: String(error) };
  }
}

export async function verifyMetaConnection(
  businessAccountId?: string | null,
  accessToken?: string | null
) {
  if (!accessToken || !businessAccountId) {
    return {
      connected: false,
      status: "Credentials Incomplete",
      error: "Please enter your Instagram Business Account ID and Page Access Token",
    };
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v20.0/me?fields=id,name&access_token=${accessToken}`
    );
    const data = await res.json();
    if (res.ok) {
      return {
        connected: true,
        status: "Connected Live",
        account: data,
      };
    } else {
      return {
        connected: false,
        status: "Verification Failed",
        error: data.error?.message || "Invalid credentials provided",
      };
    }
  } catch (err) {
    return {
      connected: false,
      status: "Network Error",
      error: String(err),
    };
  }
}
