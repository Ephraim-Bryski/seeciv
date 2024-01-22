const position = vec(0,0,0)
const direction = vec(-5,-10,-5)

const arc_radius = mag(direction)


const shaft_radius = 0.07*arc_radius
const head_radius = 2*shaft_radius
const head_length = 4*head_radius


const circle = shapes.circle({radius:shaft_radius})



const arc_path = paths.arc({radius:arc_radius, angle1:-3*Math.PI/2,angle2:0})


const arrow_shaft = extrusion({shape: circle, path: arc_path})

const base_head_pos = position.add(vec(arc_radius,0,0))
const arrow_head = cone({pos:base_head_pos,axis:vec(0,0,-head_length),radius:head_radius})


const normal0 = vec(0,1,0)
const normal_new = norm(direction)

const rotation_axis = cross(normal0,normal_new)


const rotation_angle = Math.acos(dot(normal0,normal_new))

arrow_shaft.rotate({axis: rotation_axis, angle: rotation_angle, origin: position})
arrow_head.rotate({axis: rotation_axis, angle: rotation_angle, origin: position})

arrow({axis: direction})
