import tensorflow as tf

physical_devices = tf.config.list_physical_devices('CPU')
assert len(physical_devices) == 1, "No CPUs found"
# Specify 2 virtual CPUs. Note currently memory limit is not supported.
try:
  tf.config.set_logical_device_configuration(
    physical_devices[0],
    [tf.config.LogicalDeviceConfiguration(),
     tf.config.LogicalDeviceConfiguration()])
  tf.config.set_logical_device_configuration(
    physical_devices[0],
    [tf.config.LogicalDeviceConfiguration(),
     tf.config.LogicalDeviceConfiguration(),
     tf.config.LogicalDeviceConfiguration(),
     tf.config.LogicalDeviceConfiguration()])
  logical_devices = tf.config.list_logical_devices('CPU')
  print(len(logical_devices))

  logical_devices = tf.config.list_logical_devices('CPU')
  print(len(logical_devices))
except RuntimeError as e:
  # Virtual devices must be set before GPUs have been initialized
  print(e)