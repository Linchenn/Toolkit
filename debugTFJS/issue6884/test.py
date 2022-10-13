
import tensorflow as tf

tensor = tf.tensor([[1, 2, 3], [4, 5, 6]])
x = tf.concat([t1], 0)
print(x)
x[0][0] = 10
print(x)