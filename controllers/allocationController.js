import pool from '../config/db.js';

// Allocate subjects to classes
export const allocateSubjects = async (req, res) => {
  try {
    const { classId, subjectIds } = req.body;

    // Begin transaction
    await pool.query('START TRANSACTION');

    // Delete existing allocations
    await pool.query(
      'DELETE FROM class_subjects WHERE class_id = ?',
      [classId]
    );

    // Insert new allocations
    for (const subjectId of subjectIds) {
      await pool.query(
        'INSERT INTO class_subjects (class_id, subject_id) VALUES (?, ?)',
        [classId, subjectId]
      );
    }

    // Commit transaction
    await pool.query('COMMIT');

    res.status(200).json({ message: 'Subjects allocated successfully' });
  } catch (error) {
    // Rollback on error
    await pool.query('ROLLBACK');
    console.error('Error allocating subjects:', error);
    res.status(500).json({ error: 'Failed to allocate subjects' });
  }
};
