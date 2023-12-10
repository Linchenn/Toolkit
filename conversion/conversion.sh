
# Convert and Save Keras, TF SavedModel, TFLite models
python3 keras_model.py

# Install ONNX and ONNX converter
pip install -U onnx==1.14.1
pip install -U tf2onnx

# Convert and save ONNX model
python -m tf2onnx.convert --saved-model resnet152_tf --output resnet152.onnx 