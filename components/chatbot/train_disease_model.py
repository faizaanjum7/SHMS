import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import MultiLabelBinarizer, LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score
import joblib
import warnings
warnings.filterwarnings('ignore')

class DiseasePredictionModel:
    def __init__(self):
        self.symptom_encoder = MultiLabelBinarizer()
        self.disease_encoder = LabelEncoder()
        self.model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.symptom_columns = []
        
    def load_data(self):
        """Load and preprocess the medical datasets"""
        print("Loading medical datasets...")
        
        # Load main dataset
        self.df = pd.read_csv('chatbot_data/Original_Dataset.csv')
        print(f"Loaded dataset with {len(self.df)} rows")
        
        # Load symptom weights
        self.symptom_weights = pd.read_csv('chatbot_data/Symptom_Weights.csv', 
                                         names=['symptom', 'weight'])
        self.symptom_dict = dict(zip(self.symptom_weights['symptom'], 
                                    self.symptom_weights['weight']))
        
        # Load disease descriptions
        self.disease_descriptions = pd.read_csv('chatbot_data/Disease_Description.csv')
        self.disease_desc_dict = dict(zip(self.disease_descriptions['Disease'], 
                                         self.disease_descriptions['Description']))
        
        # Load doctor specialists
        self.doctor_specialists = pd.read_csv('chatbot_data/Doctor_Specialist.csv', 
                                             names=['specialist'])
        self.specialists_list = self.doctor_specialists['specialist'].dropna().tolist()
        
        print(f"Found {len(self.symptom_dict)} symptoms")
        print(f"Found {len(self.disease_desc_dict)} diseases")
        print(f"Found {len(self.specialists_list)} specialists")
        
    def preprocess_data(self):
        """Preprocess the data for training"""
        print("Preprocessing data...")
        
        # Fill empty values with empty string
        self.df = self.df.fillna('')
        
        # Combine all symptoms for each disease
        symptom_columns = [col for col in self.df.columns if col.startswith('Symptom')]
        
        # Create list of symptoms for each row
        self.df['all_symptoms'] = self.df[symptom_columns].values.tolist()
        
        # Remove empty symptoms and clean
        self.df['all_symptoms'] = self.df['all_symptoms'].apply(
            lambda x: [symptom.strip().replace('_', ' ') 
                      for symptom in x if symptom.strip()]
        )
        
        # Remove duplicates in each symptom list
        self.df['all_symptoms'] = self.df['all_symptoms'].apply(
            lambda x: list(set(x))
        )
        
        # Filter out rows with no symptoms
        self.df = self.df[self.df['all_symptoms'].apply(len) > 0]
        
        print(f"After preprocessing: {len(self.df)} valid rows")
        
    def train_model(self):
        """Train the disease prediction model"""
        print("Training model...")
        
        # Prepare features (symptoms) and labels (diseases)
        X = self.df['all_symptoms'].tolist()
        y = self.df['Disease'].tolist()
        
        # Encode symptoms (multi-label binarization)
        X_encoded = self.symptom_encoder.fit_transform(X)
        self.symptom_columns = self.symptom_encoder.classes_
        
        # Encode diseases
        y_encoded = self.disease_encoder.fit_transform(y)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X_encoded, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
        )
        
        print(f"Training set: {X_train.shape}")
        print(f"Test set: {X_test.shape}")
        print(f"Number of diseases: {len(self.disease_encoder.classes_)}")
        print(f"Number of symptoms: {len(self.symptom_columns)}")
        
        # Train model
        self.model.fit(X_train, y_train)
        
        # Evaluate
        y_pred = self.model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        
        print(f"Model Accuracy: {accuracy:.4f}")
        
        # Detailed classification report
        disease_names = self.disease_encoder.inverse_transform(
            np.arange(len(self.disease_encoder.classes_))
        )
        print("\nClassification Report:")
        print(classification_report(y_test, y_pred, 
                                  target_names=disease_names, 
                                  zero_division=0))
        
        return accuracy
        
    def predict_disease(self, symptoms):
        """Predict disease based on symptoms"""
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
                'description': self.disease_desc_dict.get(disease, 'Description not available')
            })
        
        return {
            'primary_prediction': predicted_disease,
            'top_predictions': top_3_predictions,
            'input_symptoms': symptoms
        }
        
    def save_model(self):
        """Save the trained model and encoders"""
        print("Saving model...")
        
        model_data = {
            'model': self.model,
            'symptom_encoder': self.symptom_encoder,
            'disease_encoder': self.disease_encoder,
            'symptom_columns': self.symptom_columns,
            'disease_descriptions': self.disease_desc_dict,
            'symptom_dict': self.symptom_dict,
            'specialists_list': self.specialists_list
        }
        
        joblib.dump(model_data, 'disease_prediction_model.pkl')
        print("Model saved as 'disease_prediction_model.pkl'")
        
    def load_model(self):
        """Load a pre-trained model"""
        try:
            model_data = joblib.load('disease_prediction_model.pkl')
            self.model = model_data['model']
            self.symptom_encoder = model_data['symptom_encoder']
            self.disease_encoder = model_data['disease_encoder']
            self.symptom_columns = model_data['symptom_columns']
            self.disease_descriptions = model_data['disease_descriptions']
            self.symptom_dict = model_data['symptom_dict']
            self.specialists_list = model_data['specialists_list']
            print("Model loaded successfully!")
            return True
        except FileNotFoundError:
            print("No pre-trained model found. Please train the model first.")
            return False

def main():
    """Main training function"""
    print("=== Disease Prediction Model Training ===")
    
    # Initialize model
    dp_model = DiseasePredictionModel()
    
    # Load and preprocess data
    dp_model.load_data()
    dp_model.preprocess_data()
    
    # Train model
    accuracy = dp_model.train_model()
    
    # Save model
    dp_model.save_model()
    
    print(f"\nTraining completed! Model accuracy: {accuracy:.4f}")
    
    # Test with sample symptoms
    print("\n=== Testing Model ===")
    test_symptoms = ['itching', 'skin rash', 'nodal skin eruptions']
    prediction = dp_model.predict_disease(test_symptoms)
    
    print(f"Input symptoms: {test_symptoms}")
    print(f"Primary prediction: {prediction['primary_prediction']}")
    print("Top 3 predictions:")
    for i, pred in enumerate(prediction['top_predictions'], 1):
        print(f"{i}. {pred['disease']} ({pred['probability']:.3f})")

if __name__ == "__main__":
    main()
