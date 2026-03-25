import sys
import json
import joblib
import numpy as np

# Add the current directory to Python path
sys.path.append('.')

class DiseasePredictor:
    def __init__(self):
        try:
            # Load the trained model
            model_data = joblib.load('disease_prediction_model.pkl')
            self.model = model_data['model']
            self.symptom_encoder = model_data['symptom_encoder']
            self.disease_encoder = model_data['disease_encoder']
            self.disease_descriptions = model_data['disease_descriptions']
            self.symptom_dict = model_data['symptom_dict']
            self.specialists_list = model_data['specialists_list']
        except Exception as e:
            print(f"Error loading model: {e}")
            sys.exit(1)

    def predict_disease(self, symptoms):
        """Predict disease based on symptoms"""
        try:
            # Clean and process input symptoms
            if isinstance(symptoms, str):
                symptoms = [symptoms]
            
            symptoms = [symptom.strip().replace('_', ' ') for symptom in symptoms if symptom.strip()]
            
            # Encode symptoms
            encoded_symptoms = self.symptom_encoder.transform([symptoms])
            
            # Predict
            prediction = self.model.predict(encoded_symptoms)
            probabilities = self.model.predict_proba(encoded_symptoms)
            
            # Decode prediction
            predicted_disease = self.disease_encoder.inverse_transform(prediction)[0]
            
            # Get top 3 predictions with probabilities
            top_3_idx = np.argsort(probabilities[0])[-3:][::-1]
            top_3_predictions = []
            
            for idx in top_3_idx:
                disease = self.disease_encoder.inverse_transform([idx])[0]
                prob = probabilities[0][idx]
                top_3_predictions.append({
                    'disease': disease,
                    'probability': float(prob),
                    'description': self.disease_descriptions.get(disease, 'Description not available')
                })
            
            return {
                'primary_prediction': predicted_disease,
                'top_predictions': top_3_predictions,
                'input_symptoms': symptoms,
                'confidence': float(max(probabilities[0]))
            }
            
        except Exception as e:
            return {
                'error': str(e),
                'primary_prediction': 'Unknown',
                'top_predictions': [],
                'input_symptoms': symptoms,
                'confidence': 0.0
            }

def main():
    """Main function for command line prediction"""
    try:
        # Read symptoms from stdin
        input_data = sys.stdin.read().strip()
        if not input_data:
            print("No input received")
            sys.exit(1)
        
        # Parse symptoms from input
        symptoms = json.loads(input_data)
        
        # Initialize predictor
        predictor = DiseasePredictor()
        
        # Make prediction
        result = predictor.predict_disease(symptoms)
        
        # Output result as JSON
        print(json.dumps(result))
        
    except Exception as e:
        error_result = {
            'error': str(e),
            'primary_prediction': 'Error',
            'top_predictions': [],
            'input_symptoms': [],
            'confidence': 0.0
        }
        print(json.dumps(error_result))

if __name__ == "__main__":
    main()
