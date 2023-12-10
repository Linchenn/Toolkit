
# Convert and Save Keras, TF SavedModel, TFLite models
python3 keras_model.py

# Install ONNX and ONNX converter
pip install -U onnx==1.14.1
pip install -U tf2onnx

# Convert and save ONNX model
python -m tf2onnx.convert --saved-model resnet152_tf --output resnet152.onnx 

# Install TFJS converter
pip install tensorflowjs[wizard]

# Convert and save TFJS model
tensorflowjs_converter --input_format=tf_saved_model --output_format=tfjs_graph_model resnet152_tf resnet152_tfjs
