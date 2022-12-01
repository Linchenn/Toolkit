const tf=require("@tensorflow/tfjs")
require("@tensorflow/tfjs-node")
function avgPool3d(backend){
    tf.setBackend(backend);
    tf.ready().then(()=>{
        var input=tf.ones([14,21,10,1]);
        const output = tf.avgPool3d(input,[24,1,23],11,"valid");
        console.log(output);
    })
}
async function run(){
    await avgPool3d("tensorflow");
}
run();