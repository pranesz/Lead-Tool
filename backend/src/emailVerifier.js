import dns from "dns";
import net from "net";

// ---- Name → possible emails ----
export function generateCandidates(fullName, domain) {
  const raw = fullName.trim().toLowerCase().replace(/\s+/g, " ");
  const parts = raw.split(" ");
  const first = parts[0] || "";
  const hasLast = parts.length > 1;
  const last = hasLast ? parts[parts.length - 1] : "";

  const firstInitial = first.charAt(0);
  const lastInitial = last.charAt(0);

  const patterns = new Set();

  if (first && hasLast) {
    patterns.add(`${first}.${last}@${domain}`);       
    patterns.add(`${first}${last}@${domain}`);        
    patterns.add(`${firstInitial}${last}@${domain}`); 
    patterns.add(`${first}${lastInitial}@${domain}`); 
    patterns.add(`${first}@${domain}`);               
    patterns.add(`${last}@${domain}`);                
  } else if (first) {
    if (first.endsWith("s") && first.length > 3) {
      const base = first.slice(0, -1);  
      const lastChar = "s";
      patterns.add(`${base}.${lastChar}@${domain}`);
      patterns.add(`${base}@${domain}`);             
    } else {
      patterns.add(`${first}@${domain}`);
    }
  }

  return Array.from(patterns);
}

// ---- MX lookup ----
export function resolveMx(domain) {
  return new Promise((resolve, reject) => {
    dns.resolveMx(domain, (err, addresses) => {
      if (err || !addresses || !addresses.length) {
        return reject(new Error("No MX records for domain"));
      }
      const sorted = addresses.sort((a, b) => a.priority - b.priority);
      resolve(sorted[0].exchange);
    });
  });
}


export function smtpVerifyEmail(email, mxHost, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    let finished = false;
    let step = 0;
    let buffer = "";

    const finish = (result) => {
      if (finished) return;
      finished = true;
      try {
        socket.end("QUIT\r\n");
      } catch (e) {}
      socket.destroy();
      clearTimeout(timer);
      resolve(result);
    };

    const failUnavailable = (reason) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      try {
        socket.destroy();
      } catch (e) {}
      const err = new Error(reason || "SMTP unavailable");
      err.code = "SMTP_UNAVAILABLE";
      reject(err);
    };

    const socket = net.createConnection(25, mxHost);

    const timer = setTimeout(() => {
      // Timeout na SMTP environment suspicious → treat as unavailable
      failUnavailable("SMTP timeout");
    }, timeoutMs);

    socket.on("error", (err) => {
      console.error("SMTP error for", email, "->", err.code || err.message);

      if (
        err.code === "ECONNREFUSED" ||
        err.code === "ECONNRESET" ||
        err.code === "EHOSTUNREACH" ||
        err.code === "ETIMEDOUT"
      ) {
        // Environment la port 25 use panna mudiyadhu
        failUnavailable(err.message);
      } else {
        // Some other error; treat as unknown result
        finish(null);
      }
    });

    socket.on("data", (chunk) => {
      buffer += chunk.toString();
      if (!buffer.includes("\n")) return;

      const lines = buffer.trim().split("\n");
      const lastLine = lines[lines.length - 1].trim();
      const code = parseInt(lastLine.slice(0, 3), 10) || 0;

      buffer = "";

      if (step === 0) {
        // Greeting
        socket.write(`HELO example.com\r\n`);
        step = 1;
      } else if (step === 1) {
        socket.write(`MAIL FROM:<test@example.com>\r\n`);
        step = 2;
      } else if (step === 2) {
        socket.write(`RCPT TO:<${email}>\r\n`);
        step = 3;
      } else if (step === 3) {
        // RCPT response
        if (code >= 200 && code < 300) {
          finish(true);       // valid mailbox
        } else if (code === 550 || code === 551 || code === 553) {
          finish(false);      // invalid mailbox
        } else {
          finish(null);       // unknown / greylist
        }
      }
    });

    socket.on("end", () => {
      if (!finished) finish(null);
    });
  });
}

// ---- Main: MX + candidates + SMTP ----
export async function verifyEmailsForPerson(fullName, domain) {
  const mxHost = await resolveMx(domain.trim());
  const candidates = generateCandidates(fullName, domain.trim());

  if (!candidates.length) return [];

  const valid = [];

  // Sequential check – controlled
  for (const email of candidates) {
    let result;
    try {
      result = await smtpVerifyEmail(email, mxHost);
    } catch (err) {
      if (err.code === "SMTP_UNAVAILABLE") {
        // bubble up – caller (server.js) will handle
        throw err;
      } else {
        result = null;
      }
    }

    if (result === true) {
      valid.push({ email, score: 0.95 }); // SMTP confirmed
      // Option: break; // if you want only first valid; or keep all.
    }
    // false & null → we simply don't store
  }

  return valid; // only SMTP-confirmed emails
}