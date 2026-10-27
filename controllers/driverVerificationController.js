import path from "path";
import pool from "../config/db.js";

function normalizeGovernmentIdType(type) {
  const normalized = String(type || "")
    .trim()
    .toLowerCase();

  if (normalized === "aadhaar") {
    return "aadhaar";
  }

  if (normalized === "passport") {
    return "passport";
  }

  if (normalized === "voter id") {
    return "voter_id";
  }

  return "other";
}

function storedFilePath(file) {
  return path
    .relative(process.cwd(), file.path)
    .replaceAll("\\", "/");
}

function frontendRecord(row, userId) {
  if (!row) {
    return {
      id: "",
      user_id: String(userId),
      licence_number: "",
      licence_doc: "",
      gov_id_type: "",
      gov_id_doc: "",
      status: "not_submitted",
      remarks: null,
      submitted_at: null,
      reviewed_at: null,
    };
  }

  return {
    id: String(row.id),
    user_id: String(row.user_id),
    licence_number: row.licence_number,
    licence_doc: path.basename(row.licence_document_url),
    gov_id_type: row.government_id_type,
    gov_id_doc: path.basename(row.government_id_url),
    status: row.status,
    remarks: row.admin_remarks,
    submitted_at: row.created_at,
    reviewed_at: row.reviewed_at,
  };
}

export async function getDriverVerification(req, res) {
  try {
    const [rows] = await pool.execute(
      `SELECT *
       FROM driver_verifications
       WHERE user_id = ?
       LIMIT 1`,
      [req.user.id]
    );

    return res
      .status(200)
      .json(frontendRecord(rows[0], req.user.id));
  } catch (error) {
    console.error("Get driver verification error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load driver verification",
    });
  }
}

export async function submitDriverVerification(req, res) {
  try {
    const {
      licence_number,
      gov_id_type,
      gov_id_number,
    } = req.body;

    const licenceFile =
      req.files?.licence_document?.[0];

    const governmentIdFile =
      req.files?.government_id_document?.[0];

    if (
      !licence_number?.trim() ||
      !gov_id_type?.trim() ||
      !gov_id_number?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "All verification details are required",
      });
    }

    if (!licenceFile || !governmentIdFile) {
      return res.status(400).json({
        success: false,
        message:
          "Driving licence and government ID documents are required",
      });
    }

    const licencePath = storedFilePath(licenceFile);
    const governmentIdPath =
      storedFilePath(governmentIdFile);

    const governmentIdType =
      normalizeGovernmentIdType(gov_id_type);

    await pool.execute(
      `INSERT INTO driver_verifications (
          user_id,
          licence_number,
          licence_document_url,
          licence_document_public_id,
          government_id_type,
          government_id_number,
          government_id_url,
          government_id_public_id,
          status,
          admin_remarks,
          reviewed_by,
          reviewed_at
       )
       VALUES (?, ?, ?, NULL, ?, ?, ?, NULL, 'pending', NULL, NULL, NULL)

       ON DUPLICATE KEY UPDATE
          licence_number = VALUES(licence_number),
          licence_document_url =
            VALUES(licence_document_url),
          licence_document_public_id = NULL,
          government_id_type =
            VALUES(government_id_type),
          government_id_number =
            VALUES(government_id_number),
          government_id_url =
            VALUES(government_id_url),
          government_id_public_id = NULL,
          status = 'pending',
          admin_remarks = NULL,
          reviewed_by = NULL,
          reviewed_at = NULL,
          updated_at = CURRENT_TIMESTAMP`,
      [
        req.user.id,
        licence_number.trim(),
        licencePath,
        governmentIdType,
        gov_id_number.trim(),
        governmentIdPath,
      ]
    );

    const [rows] = await pool.execute(
      `SELECT *
       FROM driver_verifications
       WHERE user_id = ?
       LIMIT 1`,
      [req.user.id]
    );

    return res
      .status(200)
      .json(frontendRecord(rows[0], req.user.id));
  } catch (error) {
    console.error("Submit driver verification error:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message:
          "This driving licence is already registered",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to submit driver verification",
    });
  }
}