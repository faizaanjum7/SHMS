const express = require('express');
const { spawn } = require('child_process');
const path = require('path');

class DiseasePredictionService {
    constructor() {
        this.modelProcess = null;
        this.isModelReady = false;
        this.initModel();
    }

    initModel() {
        // Initialize the Python model process
        console.log('Initializing disease prediction model...');
        this.isModelReady = true;
    }

    async predictDisease(symptoms) {
        return new Promise((resolve, reject) => {
            if (!this.isModelReady) {
                return reject(new Error('Model not ready'));
            }

            // Call Python script for prediction
            const pythonProcess = spawn('python', [
                path.join(__dirname, '../predict_disease.py')
            ]);

            let output = '';
            let errorOutput = '';

            pythonProcess.stdout.on('data', (data) => {
                output += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });

            pythonProcess.on('close', (code) => {
                if (code !== 0) {
                    console.error('Python prediction error:', errorOutput);
                    return reject(new Error('Prediction failed'));
                }

                try {
                    const result = JSON.parse(output);
                    resolve(result);
                } catch (err) {
                    console.error('Failed to parse prediction result:', err);
                    reject(new Error('Invalid prediction result'));
                }
            });

            // Send symptoms to Python script via stdin
            pythonProcess.stdin.write(JSON.stringify(symptoms));
            pythonProcess.stdin.end();
        });
    }

    async getSymptomsList() {
        // Return list of all available symptoms
        return [
            'itching', 'skin rash', 'nodal skin eruptions', 'dischromic patches',
            'continuous sneezing', 'shivering', 'chills', 'watering from eyes',
            'stomach pain', 'acidity', 'ulcers on tongue', 'vomiting',
            'cough', 'chest pain', 'yellowish skin', 'nausea',
            'loss of appetite', 'abdominal pain', 'yellowing of eyes',
            'burning micturition', 'spotting urination', 'fatigue',
            'weight gain', 'anxiety', 'cold hands and feets', 'mood swings',
            'weight loss', 'restlessness', 'lethargy', 'irregular sugar level',
            'blurred and distorted vision', 'obesity', 'excessive hunger',
            'increased appetite', 'extra marital contacts', 'drying and tingling lips',
            'slurred speech', 'knee pain', 'hip joint pain', 'muscle weakness',
            'stiff neck', 'swelling joints', 'movement stiffness', 'painful walking',
            'spinning movements', 'loss of balance', 'unsteadiness',
            'weakness of one body side', 'loss of smell', 'bladder discomfort',
            'foul smell of urine', 'continuous feel of urine', 'passage of gases',
            'internal itching', 'toxic look', 'depression', 'irritability',
            'muscle pain', 'altered sensorium', 'red spots over body',
            'belly pain', 'abnormal menstruation', 'dischromic patches',
            'runny nose', 'congestion', 'chest pain', 'weakness in limbs',
            'fast heart rate', 'pain during bowel movements', 'pain in anal region',
            'bloody stool', 'irritation in anus', 'neck pain', 'dizziness',
            'cramps', 'bruising', 'swollen legs', 'swollen blood vessels',
            'puffy face and eyes', 'enlarged thyroid', 'brittle nails',
            'swollen extremeties', 'excessive hunger', 'drying and tingling lips',
            'slurred speech', 'knee pain', 'hip joint pain'
        ];
    }
}

module.exports = DiseasePredictionService;
