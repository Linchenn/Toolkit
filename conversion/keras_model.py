# Keras ResNet152
from tensorflow.keras.applications.resnet import ResNet152, ResNet50, ResNet101
from tensorflow.keras.preprocessing import image
from tensorflow.keras.applications.resnet import preprocess_input, decode_predictions
import numpy as np
import tensorflow as tf


def convertAndSaveModels(model, model_name="model"):
    # Save Keras model
    model.save('%s.h5' % model_name)
    # Save TF model
    model.save(filepath='%s_tf' % model_name, save_format='tf')
    # Convert to and save TFLite model
    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    tflite_model = converter.convert()
    with open('%s.tflite' % model_name, 'wb') as f:
        f.write(tflite_model)

def inference(model, shape=[1, 224, 224, 3]):
    input_data = tf.ones(shape, dtype=tf.float32)
    output_data = model.predict(input_data)
    print(output_data)


model = ResNet152(weights='imagenet')
convertAndSaveModels(model, 'resnet152')

# model = ResNet50(weights='imagenet')
# saveModels(model, 'resnet50')

# model = ResNet101(weights='imagenet')
# saveModels(model, 'resnet101')


