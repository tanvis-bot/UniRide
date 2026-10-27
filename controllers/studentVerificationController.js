import pool from "../config/db.js";

function formatStudentVerification(row) {
  if (!row) {
    return {
      id: "",
      user_id: "",
      college_name: "",
      enrollment_no: "",
      document_name: "",
      document_url: "",
      status: "not_submitted",
      remarks: null,
      submitted_at: null,
      reviewed_at: null,
    };
  }

  return {
    id: String(row.id),
    user_id: String(row.user_id),
    college_name: row.college_name,
    enrollment_no: row.enrollment_number,
    document_name: row.college_id_url
      ? row.college_id_url.split("/").pop()
      : "College ID",
    document_url: row.college_id_url,
    status: row.status,
    remarks: row.admin_remarks,
    submitted_at: row.created_at,
    reviewed_at: row.reviewed_at,
  };
}

export async function getMyStudentVerification(req, res) {
  try {
    const [rows] = await pool.execute(
      `SELECT *
       FROM student_verifications
       WHERE user_id = ?
       LIMIT 1`,
      [req.user.id]
    );

    return res
      .status(200)
      .json(formatStudentVerification(rows[0]));
  } catch (error) {
    console.error("Get student verification error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load student verification",
    });
  }
}

export async function submitStudentVerification(req, res) {
  try {
    const userId = req.user.id;
    const { college_name, enrollment_no } = req.body;

    if (!college_name?.trim() || !enrollment_no?.trim()) {
      return res.status(400).json({
        success: false,
        message: "College name and enrollment number are required",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload your college ID",
      });
    }

    const documentUrl =
      `${req.protocol}://${req.get("host")}` +
      `/uploads/verifications/${req.file.filename}`;

    await pool.execute(
      `INSERT INTO student_verifications
        (
          user_id,
          college_name,
          enrollment_number,
          college_id_url,
          status,
          admin_remarks,
          reviewed_by,
          reviewed_at
        )
       VALUES (?, ?, ?, ?, 'pending', NULL, NULL, NULL)

       ON DUPLICATE KEY UPDATE
         college_name = VALUES(college_name),
         enrollment_number = VALUES(enrollment_number),
         college_id_url = VALUES(college_id_url),
         status = 'pending',
         admin_remarks = NULL,
         reviewed_by = NULL,
         reviewed_at = NULL`,
      [
        userId,
        college_name.trim(),
        enrollment_no.trim(),
        documentUrl,
      ]
    );

    const [rows] = await pool.execute(
      `SELECT *
       FROM student_verifications
       WHERE user_id = ?
       LIMIT 1`,
      [userId]
    );

    return res
      .status(200)
      .json(formatStudentVerification(rows[0]));
  } catch (error) {
    console.error("Submit student verification error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to submit student verification",
    });
  }
}