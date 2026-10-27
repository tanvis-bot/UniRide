import path from "path";
import pool from "../config/db.js";

function frontendVehicle(row) {
  return {
    id: String(row.id),
    driver_id: String(row.driver_id),
    make: row.make,
    model: row.model,
    manufacturing_year: Number(
      row.manufacturing_year
    ),
    number: row.registration_number,
    color: row.color,
    seats: row.total_seats,
    registration_doc: path.basename(
      row.registration_document_url
    ),
    created_at: row.created_at,
  };
}

function validateVehicle(data) {
  const currentYear = new Date().getFullYear();

  const manufacturingYear = Number(
    data.manufacturing_year
  );

  const seats = Number(data.seats);

  if (!data.make?.trim() || !data.model?.trim()) {
    return "Vehicle make and model are required";
  }

  if (
    !Number.isInteger(manufacturingYear) ||
    manufacturingYear < 2000 ||
    manufacturingYear > currentYear + 1
  ) {
    return "Enter a valid manufacturing year";
  }

  if (!data.number?.trim() || !data.color?.trim()) {
    return "Vehicle number and colour are required";
  }

  if (
    !Number.isInteger(seats) ||
    seats < 1 ||
    seats > 7
  ) {
    return "Seating capacity must be between 1 and 7";
  }

  return null;
}

export async function listVehicles(req, res) {
  try {
    const [rows] = await pool.execute(
      `SELECT *
       FROM vehicles
       WHERE driver_id = ?
         AND is_active = TRUE
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    return res
      .status(200)
      .json(rows.map(frontendVehicle));
  } catch (error) {
    console.error("List vehicles error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load vehicles",
    });
  }
}

export async function createVehicle(req, res) {
  try {
    const validationError = validateVehicle(req.body);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message:
          "Vehicle registration document is required",
      });
    }

    const registrationDocumentPath = path
      .relative(process.cwd(), req.file.path)
      .replaceAll("\\", "/");

    const registrationNumber = req.body.number
      .trim()
      .toUpperCase();

    const [result] = await pool.execute(
      `INSERT INTO vehicles (
          driver_id,
          make,
          model,
          manufacturing_year,
          color,
          registration_number,
          vehicle_type,
          total_seats,
          registration_document_url,
          registration_document_public_id,
          is_active
       )
       VALUES (?, ?, ?, ?, ?, ?, 'car', ?, ?, NULL, TRUE)`,
      [
        req.user.id,
        req.body.make.trim(),
        req.body.model.trim(),
        Number(req.body.manufacturing_year),
        req.body.color.trim(),
        registrationNumber,
        Number(req.body.seats),
        registrationDocumentPath,
      ]
    );

    const [rows] = await pool.execute(
      `SELECT *
       FROM vehicles
       WHERE id = ? AND driver_id = ?
       LIMIT 1`,
      [result.insertId, req.user.id]
    );

    return res
      .status(201)
      .json(frontendVehicle(rows[0]));
  } catch (error) {
    console.error("Create vehicle error:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message:
          "This vehicle registration number already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to add vehicle",
    });
  }
}

export async function updateVehicle(req, res) {
  try {
    const validationError = validateVehicle(req.body);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const registrationNumber = req.body.number
      .trim()
      .toUpperCase();

    const [result] = await pool.execute(
      `UPDATE vehicles
       SET make = ?,
           model = ?,
           manufacturing_year = ?,
           color = ?,
           registration_number = ?,
           total_seats = ?
       WHERE id = ?
         AND driver_id = ?
         AND is_active = TRUE`,
      [
        req.body.make.trim(),
        req.body.model.trim(),
        Number(req.body.manufacturing_year),
        req.body.color.trim(),
        registrationNumber,
        Number(req.body.seats),
        req.params.id,
        req.user.id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    const [rows] = await pool.execute(
      `SELECT *
       FROM vehicles
       WHERE id = ? AND driver_id = ?
       LIMIT 1`,
      [req.params.id, req.user.id]
    );

    return res
      .status(200)
      .json(frontendVehicle(rows[0]));
  } catch (error) {
    console.error("Update vehicle error:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message:
          "This vehicle registration number already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to update vehicle",
    });
  }
}

export async function removeVehicle(req, res) {
  try {
    const [activeRides] = await pool.execute(
      `SELECT COUNT(*) AS total
       FROM rides
       WHERE vehicle_id = ?
         AND driver_id = ?
         AND status IN ('scheduled', 'in_progress')`,
      [req.params.id, req.user.id]
    );

    if (Number(activeRides[0].total) > 0) {
      return res.status(409).json({
        success: false,
        message:
          "A vehicle with an active or scheduled ride cannot be removed",
      });
    }

    const [result] = await pool.execute(
      `UPDATE vehicles
       SET is_active = FALSE
       WHERE id = ?
         AND driver_id = ?
         AND is_active = TRUE`,
      [req.params.id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    return res.status(200).json({
      ok: true,
    });
  } catch (error) {
    console.error("Remove vehicle error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to remove vehicle",
    });
  }
}