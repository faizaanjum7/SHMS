import pandas as pd
import numpy as np
from sklearn.metrics import classification_report, confusion_matrix
import joblib
import json

class MLModelValidator:
    def __init__(self):
        # Load the trained model and data
        self.model_data = joblib.load('disease_prediction_model.pkl')
        self.model = self.model_data['model']
        self.symptom_encoder = self.model_data['symptom_encoder']
        self.disease_encoder = self.model_data['disease_encoder']
        self.disease_descriptions = self.model_data['disease_descriptions']
        
        # Load original dataset for testing
        self.df = pd.read_csv('chatbot_data/Original_Dataset.csv')
        self.preprocess_test_data()
        
    def preprocess_test_data(self):
        """Preprocess test data like in training"""
        self.df = self.df.fillna('')
        symptom_columns = [col for col in self.df.columns if col.startswith('Symptom')]
        
        self.df['all_symptoms'] = self.df[symptom_columns].values.tolist()
        self.df['all_symptoms'] = self.df['all_symptoms'].apply(
            lambda x: [symptom.strip().replace('_', ' ') 
                      for symptom in x if symptom.strip()]
        )
        self.df['all_symptoms'] = self.df['all_symptoms'].apply(
            lambda x: list(set(x))
        )
        self.df = self.df[self.df['all_symptoms'].apply(len) > 0]
        
    def test_known_cases(self):
        """Test with well-known symptom-disease combinations"""
        print("=== Testing Known Medical Cases ===\n")
        
        test_cases = [
            {
                'symptoms': ['itching', 'skin rash', 'nodal skin eruptions'],
                'expected_disease': 'Fungal infection',
                'description': 'Classic fungal infection symptoms'
            },
            {
                'symptoms': ['chest pain'],
                'expected_disease': 'Heart attack',
                'description': 'Primary heart attack symptom'
            },
            {
                'symptoms': ['headache'],
                'expected_disease': 'Migraine',
                'description': 'Common migraine symptom'
            },
            {
                'symptoms': ['cough'],
                'expected_disease': 'Common Cold',
                'description': 'Common cold symptom'
            },
            {
                'symptoms': ['high fever', 'headache'],
                'expected_disease': 'Malaria',  # or Dengue
                'description': 'Fever with headache typical of mosquito-borne diseases'
            }
        ]
        
        for i, case in enumerate(test_cases, 1):
            result = self.predict_disease(case['symptoms'])
            
            print(f"Test Case {i}: {case['description']}")
            print(f"Symptoms: {case['symptoms']}")
            print(f"Expected: {case['expected_disease']}")
            print(f"Predicted: {result['primary_prediction']}")
            print(f"Confidence: {result['confidence']:.3f}")
            
            # Check if prediction matches expected or is in top 3
            top_diseases = [pred['disease'] for pred in result['top_predictions']]
            is_correct = result['primary_prediction'] == case['expected_disease']
            is_in_top3 = case['expected_disease'] in top_diseases
            
            print(f"✅ Correct Prediction: {is_correct}")
            print(f"✅ In Top 3: {is_in_top3}")
            
            if not is_correct and not is_in_top3:
                print("⚠️  UNEXPECTED RESULT - Review needed")
            
            print("-" * 60)
            
    def predict_disease(self, symptoms):
        """Predict disease using the trained model"""
        try:
            # Encode symptoms
            encoded_symptoms = self.symptom_encoder.transform([symptoms])
            
            # Predict
            prediction = self.model.predict(encoded_symptoms)
            probabilities = self.model.predict_proba(encoded_symptoms)
            
            # Decode prediction
            predicted_disease = self.disease_encoder.inverse_transform(prediction)[0]
            
            # Get top 3 predictions
            top_3_idx = np.argsort(probabilities[0])[-3:][::-1]
            top_3_predictions = []
            
            for idx in top_3_idx:
                disease = self.disease_encoder.inverse_transform([idx])[0]
                prob = probabilities[0][idx]
                top_3_predictions.append({
                    'disease': disease,
                    'probability': float(prob),
                    'description': self.disease_descriptions.get(disease, 'No description available')
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
                'primary_prediction': 'Error',
                'top_predictions': [],
                'input_symptoms': symptoms,
                'confidence': 0.0
            }
    
    def validate_with_training_data(self):
        """Test predictions against actual training data"""
        print("\n=== Validation with Training Data ===\n")
        
        # Sample 20 random cases from training data
        sample_cases = self.df.sample(20, random_state=42)
        
        correct_predictions = 0
        top3_correct = 0
        total_cases = len(sample_cases)
        
        for idx, row in sample_cases.iterrows():
            actual_disease = row['Disease']
            symptoms = row['all_symptoms']
            
            # Predict
            result = self.predict_disease(symptoms)
            predicted_disease = result['primary_prediction']
            top_diseases = [pred['disease'] for pred in result['top_predictions']]
            
            # Check accuracy
            if predicted_disease == actual_disease:
                correct_predictions += 1
            if actual_disease in top_diseases:
                top3_correct += 1
            
            print(f"Actual: {actual_disease}")
            print(f"Predicted: {predicted_disease}")
            print(f"Top 3: {top_diseases}")
            print(f"Confidence: {result['confidence']:.3f}")
            print("-" * 40)
        
        accuracy = correct_predictions / total_cases
        top3_accuracy = top3_correct / total_cases
        
        print(f"\n📊 Validation Results:")
        print(f"Exact Accuracy: {accuracy:.3f} ({correct_predictions}/{total_cases})")
        print(f"Top-3 Accuracy: {top3_accuracy:.3f} ({top3_correct}/{total_cases})")
        
    def analyze_feature_importance(self):
        """Analyze which symptoms are most important for predictions"""
        print("\n=== Feature Importance Analysis ===\n")
        
        # Get feature importance from the model
        feature_importance = self.model.feature_importances_
        symptom_names = self.symptom_encoder.classes_
        
        # Create importance dataframe
        importance_df = pd.DataFrame({
            'symptom': symptom_names,
            'importance': feature_importance
        }).sort_values('importance', ascending=False)
        
        print("Top 20 Most Important Symptoms:")
        for i, row in importance_df.head(20).iterrows():
            print(f"{i+1:2d}. {row['symptom']:<30} - {row['importance']:.4f}")
        
        return importance_df
    
    def disease_distribution_analysis(self):
        """Analyze disease prediction distribution"""
        print("\n=== Disease Distribution Analysis ===\n")
        
        # Count diseases in training data
        disease_counts = self.df['Disease'].value_counts()
        
        print("Disease Distribution in Training Data:")
        print(f"Total diseases: {len(disease_counts)}")
        print(f"Total cases: {len(self.df)}")
        print("\nTop 10 Most Common Diseases:")
        
        for i, (disease, count) in enumerate(disease_counts.head(10).items(), 1):
            percentage = (count / len(self.df)) * 100
            print(f"{i:2d}. {disease:<30} - {count:3d} cases ({percentage:.1f}%)")
    
    def generate_test_report(self):
        """Generate comprehensive test report"""
        print("=" * 80)
        print("🏥 SHM HOSPITAL ML MODEL VALIDATION REPORT")
        print("=" * 80)
        
        # Run all tests
        self.test_known_cases()
        self.validate_with_training_data()
        self.analyze_feature_importance()
        self.disease_distribution_analysis()
        
        print("\n" + "=" * 80)
        print("✅ VALIDATION COMPLETE")
        print("=" * 80)

def main():
    validator = MLModelValidator()
    validator.generate_test_report()

if __name__ == "__main__":
    main()
