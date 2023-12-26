@vertex
fn main(@builtin(vertex_index) idx : u32) -> @builtin(position) vec4f {
    var data = array<vec2<f32>, 6>(
        vec2<f32>(-1.0, -1.0),
        vec2<f32>(1.0, -1.0),
        vec2<f32>(1.0, 1.0),

        vec2<f32>(-1.0, -1.0),
        vec2<f32>(-1.0, 1.0),
        vec2<f32>(1.0, 1.0),
    );

    return vec4f(data[idx], 0.0, 1.0);
}