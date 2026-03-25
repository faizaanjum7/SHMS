const express = require('express');
const router = express.Router();
const appointmentService = require('../services/appointmentService');

// GET /api/doctors - Get all doctors
router.get('/', (req, res) => {
  try {
    const doctors = appointmentService.getAllDoctors();
    res.status(200).json({
      success: true,
      count: doctors.length,
      doctors: doctors
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching doctors',
      error: error.message
    });
  }
});

// POST /api/doctors/symptom - Find doctors by symptom
router.post('/symptom', (req, res) => {
  try {
    const { symptom } = req.body;
    
    if (!symptom) {
      return res.status(400).json({
        success: false,
        message: 'Symptom is required'
      });
    }

    const result = appointmentService.findDoctorsForSymptoms(symptom);
    
    if (!result) {
      return res.status(200).json({
        success: true,
        found: false,
        message: `I couldn't find a specific doctor for "${symptom}". Would you like to speak with our General Medicine department?`,
        suggestion: 'General Medicine'
      });
    }

    res.status(200).json({
      success: true,
      found: true,
      specialty: result.specialty,
      message: `Based on your symptoms, I recommend seeing a ${result.specialty} specialist.`,
      doctors: result.doctors
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error finding doctors',
      error: error.message
    });
  }
});

// GET /api/doctors/availability - Check doctor availability
router.get('/availability', (req, res) => {
  try {
    const { doctorName, date } = req.query;
    
    if (!doctorName || !date) {
      return res.status(400).json({
        success: false,
        message: 'Doctor name and date are required'
      });
    }

    const result = appointmentService.checkDoctorAvailability(doctorName, date);
    
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking availability',
      error: error.message
    });
  }
});

// POST /api/doctors/book - Book an appointment
router.post('/book', (req, res) => {
  try {
    const { doctorId, date, timeSlot, patientName, patientPhone, symptoms } = req.body;
    
    if (!doctorId || !date || !timeSlot || !patientName || !patientPhone) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: doctorId, date, timeSlot, patientName, patientPhone'
      });
    }

    const result = appointmentService.bookAppointment({
      doctorId: parseInt(doctorId),
      date,
      timeSlot,
      patientName,
      patientPhone,
      symptoms: symptoms || 'Not specified'
    });

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error booking appointment',
      error: error.message
    });
  }
});

// GET /api/doctors/appointments - Get patient appointments
router.get('/appointments', (req, res) => {
  try {
    const { phone } = req.query;
    
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    const appointments = appointmentService.getPatientAppointments(phone);
    
    res.status(200).json({
      success: true,
      count: appointments.length,
      appointments: appointments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching appointments',
      error: error.message
    });
  }
});

// DELETE /api/doctors/appointments/:id - Cancel appointment
router.delete('/appointments/:id', (req, res) => {
  try {
    const appointmentId = parseInt(req.params.id);
    
    const result = appointmentService.cancelAppointment(appointmentId);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error cancelling appointment',
      error: error.message
    });
  }
});

module.exports = router;
