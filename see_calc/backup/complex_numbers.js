

/*


NOT USING RIGHT NOW

BUT

WOULD ALLOW ME TO WORK WITH COMPLEX NUMBERS

    (right now im just refusing to exponend fractional exponent if ther's a negative coefficient)

*/


// since these objects are very small, i think i will ALWAYS return a new object on operations instead of mutating



/*



instanceof check instead of checking if it's a string

in eqn_to_tree, create a Complex object instead of string
    no combining numbers to form fractions
in draw, use the Complex print method

the operation functions should class the Complex methods instead

in tree_to_eqn you need to:
    throw error if imaginary component
    split real component into numerator and denominator





*/






class Complex {


    /*


    not sure if complex is the best name cause all the numbers would be complex
        real numbers would just have 0 imaginary component

    the real and complex componets can be fractions or just regular numbers


    for now i'll make the operations nonstatic but returns a new complex

    e.g

    new_val = old_val.add(num_or_complex)


    you would have to interact with the Rational and Complex class in the solver:

    Complex(Rational(3,4)) --> 3/4 + 0i
    Complex(0.37)          --> 0.37 + 0i
    Complex(3/4)           --> 0.75 + 0i    <-- basically DONT do this 

    Complex(2) would also be bad since it's storing a number instead of a fraction object 
    this means any operation on it would still just be a decimal


    so in the solver you would check if it's a decimal
        it is --> Complex(thatdecimal)
        it's not (whole number or fraction) --> Complex(Rational(num,1)) or Complex(Rational(num,den))


    Complex can't handle this directly because inside here im calling the Complex constructor WITH
        the fraction objects, so that's how i have to pass stuff in to it


    */

    //! not sure if Rational(0,1) will work
    constructor(real, imaginary = new Rational(0,1)){

        this.re = Rational.to_rational(real)
        this.im = Rational.to_rational(imaginary)
    }


    print(){
        return Rational.print(this.re) + " + " + Rational.print(this.im) + " i"
    }

    static get machinezero(){
        return 10 ** -8
    }

    abs(){
        return Rational.power(Rational.add(Rational.power(this.re, 2),Rational.power(this.im, 2)), 0.5)
    }

    is_real(){
        return Math.abs(Rational.to_float(this.im)) < Complex.machinezero
    }

    power(exponent) {

        const base = this

        if (!(exponent instanceof Complex)){
            throw "should only raising to power of complex objects"
        }


        if (!(exponent.is_real())){
            throw "cannot raise number to a complex exponent"
        }

        const real_exponent = Rational.to_float(exponent.re) 

        const magnitude = Rational.power(base.abs(), real_exponent);


        const phase = Math.PI * (base < 0 ? 1 : 0) * real_exponent

        const real = Rational.times(magnitude, Math.cos(phase))
        const imaginary = Rational.times(magnitude, Math.sin(phase))
        
        return new Complex(real, imaginary)
    }


    add(value) {
        
        
        if (!(value instanceof Complex)){
            throw "should only adding on complex objects"
        }

        const new_real = Rational.add(this.re, value.re)
        const new_imaginary = Rational.add(this.im, value.im)

        return new Complex(new_real, new_imaginary)

    }

    times(value) {

        if (!(value instanceof Complex)){
            throw "should only multiply on complex objects"
        }

        // (a + bi) * (c + di)

        const ac = Rational.times(this.re, value.re)
        const bd = Rational.times(this.im, value.im)
        const ad = Rational.times(this.re, value.im)
        const bc = Rational.times(this.im, value.re)

        const neg_bd = Rational.times(bd, new Rational(-1, 1))

        const new_real      = Rational.add(ac, neg_bd)
        const new_imaginary = Rational.add(ad, bc)

        return new Complex(new_real, new_imaginary)

    }

    trig(trig_op){

        if (!(exponent.is_real())){
            throw "cannot perform a trig function on a complex number"
        }


        const value = Rational.to_float(this.re)

        const expression = trig_op + String(value) + ")"

        const result = math.evaluate(expression)

        return new Complex(new Rational(result))
    }

}

class Rational {

    constructor(num_value,den_value){
    

        if (den_value === undefined){
            throw "needs two input arguments, must explicitly state the denominator for now, just use 1 if you don't want a fraction"
        }

        //! if num_value is not an integer, just construct num: (num_value/den_value) den: 1
    

        const both_integers = Rational.is_integer(num_value) && Rational.is_integer(den_value)

        if (!both_integers){

            this.num = num_value / den_value
            this.den = 1

            return 
        }

        const num_abs = Math.abs(num_value)
        const den_abs = Math.abs(den_value)
    
    
        function get_gcf(a, b) {
            // euclidean algorithm (just got from chatgpt)
            if (b > a) {
                [a, b] = [b, a];
            }
          
            while (b !== 0) {
                const remainder = a % b;
                a = b;
                b = remainder;
            }
          
            return a;
        }

        const gcf = get_gcf(num_abs, den_abs)
    
        if (num_value > 0 && den_value < 0){
            num_value = -num_value
            den_value = -den_value
        }

        const reduced_num = num_value / gcf
        const reduced_den = den_value / gcf
        
        this.num = reduced_num
        this.den = reduced_den
    }

    static is_integer(value){
        //! most likely can be factored out (would only be used in the constructor now)
        // method is NEVER called on Rational object, always float
        // it's just used in a couple places so i made it a method

        return Math.abs(Math.round(value) - value) < 10 ** -8
    }

    static print(value){
        if (value instanceof Rational){
            return value.num + "/" + value.den
        }else{
            return String(value)
        }
    }

    static to_float(value){

        if (value instanceof Rational){
            return value.num / value.den
        }else if (typeof value === 'number'){
            return value
        }else{
            throw "value must be a fraction or number"
        }
        
    }

    
    static to_rational(value){

        if (value instanceof Rational){
            return value
        }else if (typeof value === 'number'){
            return new Rational(value, 1)
        }else{
            throw 'nope'
        }

    }


    static abs(value){


        value = Rational.to_rational(value)


        const new_num = Math.abs(value.num)
        const new_den = value.den

        if (new_den < 0){
            throw "i thought the denominator would always be positive"
        }

        return new Rational(new_num, new_den)

    }

    static add(value1, value2){

        value1 = Rational.to_rational(value1)
        value2 = Rational.to_rational(value2)

        const new_den = value1.den * value2.den

        const new_num1 = new_den / value1.den * value1.num    
        const new_num2 = new_den / value2.den * value2.num

        const new_num = new_num1 + new_num2

        return new Rational(new_num, new_den)

    }

    static times(value1, value2){


        value1 = Rational.to_rational(value1)
        value2 = Rational.to_rational(value2)

        const new_num = value1.num * value2.num
        const new_den = value1.den * value2.den
        
        return new Rational(new_num, new_den)

    }

    static power(base, exponent){

        base = Rational.to_rational(base)
        exponent = Rational.to_float(exponent)

        let numerator, denominator

    
        numerator = base.num
        denominator = base.den
    

        if (exponent < 0){
            [numerator, denominator] = [denominator, numerator]
        }

        const pos_exponent = Math.abs(exponent)

        const raised_numerator = numerator ** pos_exponent
        const raised_denominator = denominator ** pos_exponent

        return new Rational(raised_numerator, raised_denominator)

    }
}

/*


if you want to create 1.2 (some float)

you do NOT do:

Complex(1.2)

INSTEAD:

Complex(Rational(1.2, 1)) <-- Rational should be renamed Rational


in that case you get

1.2/1 + 0/1 i

*/

a = new Complex(new Rational(3,1))

b = new Complex(new Rational(3,1), new Rational(1,3))

c = a.power(new Complex(2))

console.log(c.print())

