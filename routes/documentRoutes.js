const express = require("express");
const multer = require("multer");
const { GridFSBucket, ObjectId } = require("mongodb");

const {
  connectDB
} = require("../config/mongodb");

const router = express.Router();


// ======================================================
// MULTER CONFIGURATION
// ======================================================

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB
  },

  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png"
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(
        new Error(
          "Only PDF, JPG, JPEG and PNG medical documents are allowed."
        )
      );
    }

    cb(null, true);
  }
});


// ======================================================
// HELPER
// ======================================================

async function getDatabase() {
  const db = await connectDB();

  if (!db) {
    throw new Error(
      "MongoDB database connection is not available."
    );
  }

  return db;
}


// ======================================================
// POST /api/documents/upload
//
// Upload actual patient medical document
// ======================================================

router.post(
  "/upload",
  upload.single("file"),
  async (req, res) => {
    try {
      const {
        consultation_id,
        patient_id
      } = req.body;

      // --------------------------------------------------
      // VALIDATION
      // --------------------------------------------------

      if (!consultation_id) {
        return res.status(400).json({
          success: false,
          error: "CONSULTATION_ID_REQUIRED",
          message:
            "consultation_id is required before uploading a document."
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "FILE_REQUIRED",
          message:
            "Please provide a document file."
        });
      }


      // --------------------------------------------------
      // DATABASE
      // --------------------------------------------------

      const db = await getDatabase();


      // --------------------------------------------------
      // OPTIONAL BUT IMPORTANT:
      // Verify that consultation exists
      // --------------------------------------------------

      const consultation =
        await db
          .collection("consultations")
          .findOne({
            consultation_id
          });

      /*
       * Some earlier versions of your consultation backend
       * may not yet persist the consultation collection.
       *
       * Therefore we warn rather than block here for now.
       *
       * Once consultation persistence is confirmed,
       * we can make this a strict 404.
       */

      if (!consultation) {
        console.warn(
          `[Documents] Consultation ${consultation_id} was not found in consultations collection.`
        );
      }


      // --------------------------------------------------
      // CREATE GRIDFS BUCKET
      // --------------------------------------------------

      const bucket = new GridFSBucket(
        db,
        {
          bucketName: "medical_documents"
        }
      );


      // --------------------------------------------------
      // STORE REAL FILE
      // --------------------------------------------------

      const uploadStream =
        bucket.openUploadStream(
          req.file.originalname,
          {
            contentType:
              req.file.mimetype,

            metadata: {
              consultation_id,

              patient_id:
                patient_id || null,

              original_name:
                req.file.originalname,

              uploaded_at:
                new Date()
            }
          }
        );


      uploadStream.end(
        req.file.buffer
      );


      uploadStream.on(
        "error",
        (error) => {
          console.error(
            "[Documents] GridFS upload failed:",
            error
          );

          if (!res.headersSent) {
            return res.status(500).json({
              success: false,
              error:
                "DOCUMENT_UPLOAD_FAILED",
              message:
                error.message
            });
          }
        }
      );


      uploadStream.on(
        "finish",
        async () => {
          try {
            const document = {
              document_id:
                uploadStream.id.toString(),

              gridfs_file_id:
                uploadStream.id,

              consultation_id,

              patient_id:
                patient_id || null,

              file_name:
                req.file.originalname,

              mime_type:
                req.file.mimetype,

              size_bytes:
                req.file.size,

              storage:
                "mongodb_gridfs",

              processing_status:
                "uploaded",

              // IMPORTANT:
              // We are not pretending OCR happened.
              ocr_status:
                "not_processed",

              uploaded_at:
                new Date()
            };


            // ----------------------------------------------
            // SAVE SEARCHABLE DOCUMENT METADATA
            // ----------------------------------------------

            await db
              .collection(
                "consultation_documents"
              )
              .insertOne(document);


            console.log(
              `[Documents] Uploaded ${document.file_name} for ${consultation_id}`
            );


            return res
              .status(201)
              .json({
                success: true,

                message:
                  "Medical document uploaded successfully.",

                document: {
                  document_id:
                    document.document_id,

                  consultation_id:
                    document.consultation_id,

                  patient_id:
                    document.patient_id,

                  file_name:
                    document.file_name,

                  mime_type:
                    document.mime_type,

                  size_bytes:
                    document.size_bytes,

                  processing_status:
                    document.processing_status,

                  ocr_status:
                    document.ocr_status,

                  uploaded_at:
                    document.uploaded_at
                }
              });

          } catch (error) {
            console.error(
              "[Documents] Metadata save failed:",
              error
            );

            return res.status(500).json({
              success: false,
              error:
                "DOCUMENT_METADATA_FAILED",
              message:
                error.message
            });
          }
        }
      );

    } catch (error) {
      console.error(
        "[Documents] Upload route error:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          "DOCUMENT_UPLOAD_ERROR",
        message:
          error.message
      });
    }
  }
);


// ======================================================
// GET /api/documents/consultation/:consultationId
//
// Used by BOTH patient UI and doctor portal
// ======================================================

router.get(
  "/consultation/:consultationId",
  async (req, res) => {
    try {
      const {
        consultationId
      } = req.params;

      const db = await getDatabase();

      const documents =
        await db
          .collection(
            "consultation_documents"
          )
          .find({
            consultation_id:
              consultationId
          })
          .sort({
            uploaded_at: -1
          })
          .toArray();


      return res.json({
        success: true,

        consultation_id:
          consultationId,

        count:
          documents.length,

        documents:
          documents.map(
            (document) => ({
              document_id:
                document.document_id,

              consultation_id:
                document.consultation_id,

              patient_id:
                document.patient_id || null,

              file_name:
                document.file_name,

              mime_type:
                document.mime_type,

              size_bytes:
                document.size_bytes,

              processing_status:
                document.processing_status,

              ocr_status:
                document.ocr_status,

              uploaded_at:
                document.uploaded_at,

              file_url:
                `/api/documents/${document.document_id}/file`
            })
          )
      });

    } catch (error) {
      console.error(
        "[Documents] List error:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          "DOCUMENT_LIST_ERROR",
        message:
          error.message
      });
    }
  }
);


// ======================================================
// GET /api/documents/:documentId/file
//
// Streams actual PDF/image.
// Doctor portal can open this URL.
// ======================================================

router.get(
  "/:documentId/file",
  async (req, res) => {
    try {
      const {
        documentId
      } = req.params;


      if (
        !ObjectId.isValid(
          documentId
        )
      ) {
        return res.status(400).json({
          success: false,
          error:
            "INVALID_DOCUMENT_ID"
        });
      }


      const db = await getDatabase();


      const fileId =
        new ObjectId(
          documentId
        );


      // Find GridFS metadata first
      const file =
        await db
          .collection(
            "medical_documents.files"
          )
          .findOne({
            _id: fileId
          });


      if (!file) {
        return res.status(404).json({
          success: false,
          error:
            "DOCUMENT_NOT_FOUND"
        });
      }


      const bucket =
        new GridFSBucket(
          db,
          {
            bucketName:
              "medical_documents"
          }
        );


      res.setHeader(
        "Content-Type",
        file.contentType ||
          "application/octet-stream"
      );


      /*
       * inline allows PDFs/images to open
       * directly in the doctor's browser.
       */
      res.setHeader(
        "Content-Disposition",
        `inline; filename="${encodeURIComponent(
          file.filename
        )}"`
      );


      const downloadStream =
        bucket.openDownloadStream(
          fileId
        );


      downloadStream.on(
        "error",
        (error) => {
          console.error(
            "[Documents] Download error:",
            error
          );

          if (!res.headersSent) {
            res.status(500).json({
              success: false,
              error:
                "DOCUMENT_DOWNLOAD_ERROR"
            });
          }
        }
      );


      downloadStream.pipe(res);

    } catch (error) {
      console.error(
        "[Documents] File route error:",
        error
      );

      if (!res.headersSent) {
        return res.status(500).json({
          success: false,
          error:
            "DOCUMENT_FILE_ERROR",
          message:
            error.message
        });
      }
    }
  }
);


// ======================================================
// DELETE /api/documents/:documentId
//
// Patient can remove a document before continuing.
// ======================================================

router.delete(
  "/:documentId",
  async (req, res) => {
    try {
      const {
        documentId
      } = req.params;


      if (
        !ObjectId.isValid(
          documentId
        )
      ) {
        return res.status(400).json({
          success: false,
          error:
            "INVALID_DOCUMENT_ID"
        });
      }


      const db =
        await getDatabase();


      const fileId =
        new ObjectId(
          documentId
        );


      const bucket =
        new GridFSBucket(
          db,
          {
            bucketName:
              "medical_documents"
          }
        );


      try {
        await bucket.delete(
          fileId
        );
      } catch (error) {
        console.warn(
          "[Documents] GridFS delete notice:",
          error.message
        );
      }


      await db
        .collection(
          "consultation_documents"
        )
        .deleteOne({
          document_id:
            documentId
        });


      return res.json({
        success: true,
        message:
          "Document removed successfully."
      });

    } catch (error) {
      console.error(
        "[Documents] Delete error:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          "DOCUMENT_DELETE_ERROR",
        message:
          error.message
      });
    }
  }
);


// ======================================================
// MULTER ERROR HANDLER
// ======================================================

router.use(
  (
    error,
    req,
    res,
    next
  ) => {

    if (
      error instanceof
      multer.MulterError
    ) {
      if (
        error.code ===
        "LIMIT_FILE_SIZE"
      ) {
        return res.status(400).json({
          success: false,
          error:
            "FILE_TOO_LARGE",
          message:
            "Document must be smaller than 10 MB."
        });
      }
    }


    if (error) {
      return res.status(400).json({
        success: false,
        error:
          "INVALID_DOCUMENT",
        message:
          error.message
      });
    }


    next();
  }
);


module.exports = router;