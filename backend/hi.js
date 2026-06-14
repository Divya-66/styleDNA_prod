const crypto = require("crypto");

const SECRET = "mysecretkey";

// Base64URL encode
function base64url(input) {
    return Buffer.from(input)
        .toString("base64")
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");
}

// Create JWT
function sign(payload) {
    const header = { alg: "HS256", typ: "JWT" };

    const encodedHeader = base64url(JSON.stringify(header));
    const encodedPayload = base64url(JSON.stringify(payload));

    const data = encodedHeader + "." + encodedPayload;

    const signature = crypto
        .createHmac("sha256", SECRET)
        .update(data)
        .digest("base64")
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");

    return data + "." + signature;
}

// Verify JWT
function verify(token) {
    const parts = token.split(".");
    if (parts.length !== 3) return "Invalid token";

    const [header, payload, signature] = parts;
    const data = header + "." + payload;

    const newSignature = crypto
        .createHmac("sha256", SECRET)
        .update(data)
        .digest("base64")
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");

    if (newSignature !== signature) return "Invalid signature";

    const decodedPayload = JSON.parse(
        Buffer.from(payload, "base64").toString()
    );

    return decodedPayload;
}

// Example usage
const token = sign({ userId: 1, name: "John" });
console.log("Token:\n", token);

const result = verify(token);
console.log("\nVerified:\n", result);