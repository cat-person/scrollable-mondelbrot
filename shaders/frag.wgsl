struct FsInput {
    @builtin(position) position: vec4f,
}

struct VsInput {
    centerPosition: vec2f,
    scale: f32,
}

@group(0) @binding(0) var<uniform> vsInput: VsInput;

@fragment 
fn main(fsInput: FsInput) -> @location(0) vec4f {
    let pos = vec2f(
        vsInput.scale * (fsInput.position[0] - 450.0) / 200.0 + vsInput.centerPosition[0], 
        vsInput.scale * (fsInput.position[1] - 300.0) / 200.0 + vsInput.centerPosition[1]);


    var z = pos;
    var maxI = 256u;
    var i = maxI;

    while !oob(z) && i > 0u {
        i -= 1u;
        z = square(z) + pos;
    }

    var c = f32(i) / f32(maxI);

    

    if(i == 0) {
        return vec4f(
            0.0,
            0.0,
            0.0,
            1); 
    } else if (0.2 < c) {
        return vec4f(
            4.0 * (0.5 - c) * (0.5 - c),
            3.2 * (0.45 - c) * (0.45 - c),
            5.0 * (0.55 - c) * (0.55 - c),
            1);
    } else {
        return vec4f(
            4.0 * (1 - c) * c,
            4.0 * (1 - c) * (1.2 - c),
            8.0 * (1 - c) * (c - 0.5) * (c - 0.5),
            1);
    }
}

fn square(c: vec2f) -> vec2f {
    // (a+bi)(a+bi) = aa - bb + 2abi
    return vec2f(
        c.x * c.x - c.y * c.y,
        2f * c.x * c.y,
    );
}

fn oob(c: vec2f) -> bool {
    return abs(c.x) > 2f || abs(c.y) > 2f;
}