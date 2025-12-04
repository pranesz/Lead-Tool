import express from "express";
import cors from "cors";
import { verifyEmailsForPerson } from "./emailVerifier.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.post("/api/find-emails", async (req, res) => {
  const { fullName, domain } = req.body;
  console.log("Hit /api/find-emails with body:", req.body);

  if (!fullName || !domain) {
    return res.status(400).json({
      success: false,
      message: "fullName and domain are required",
    });
  }

  try {
    const results = await verifyEmailsForPerson(fullName, domain);

    return res.json({
      success: true,
      totalFound: results.length,
      results,
    });
  } catch (err) {
    console.error("Error verifying emails:", err.code || err.message);

    if (err.code === "SMTP_UNAVAILABLE") {
      return res.status(503).json({
        success: false,
        reason: "smtp_unavailable",
        message:
          "SMTP server kitta connect panna mudiyala (port 25 blocked or unreachable). Email verify panna mudiyala.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to verify emails (MX/SMTP error)",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
