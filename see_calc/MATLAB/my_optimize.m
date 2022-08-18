
function sol=my_optimize(eqns,obj,guess)
    %! substitute values for eqns like x=4 so there's less variables to adjust
   



    equal=[];
    inequal=[];
    for i=1:length(eqns)
        eqn=eqns(i);
        if contains(string(eqn),"<") || contains(string(eqn),">")
            inequal=[inequal,eqn];
        else
            equal=[equal,eqn];
        end
    
    end
    
    
    %! add check to make sure all solutions are numeric answers
    x0=vpasolve([equal,str2sym(guess)]);
    
    %! need to add code to check if the initial solution satisfifies all
    %inequalities
    

    prob=optimproblem;
    eq_vars=string(symvar([equal,inequal]));
    
    for i=1:length(eq_vars)
        eq_var=char(eq_vars(i));
        eval([eq_var,'=optimvar("',eq_var,'")'])
%         if init_reset
%             eval(['x0.',eq_var,'=rand()'])
%         end
    end

    if ~isempty(equal)
        prob.Constraints.eq=eval(char(equal));
    end

    if ~isempty(inequal)
        prob.Constraints.ineq=eval(char(inequal));
    end

    
    
    if  ~isempty(obj)
        obj_vars=string(symvar(str2sym(obj)));
        func_txt=['@('];
        def_obj_command=['objfunx('];
        for i=1:length(obj_vars)
            obj_var=char(obj_vars(i));
            func_txt=[func_txt,obj_var,','];
            def_obj_command=[def_obj_command,obj_var,','];
        end
        
        func_txt(end)=[];
        def_obj_command(end)=[];
        
        func_txt=[func_txt,') ',char(obj)];
        objfunx=str2func(func_txt);
        
        def_obj_command=[def_obj_command,');'];
        prob.Objective=eval(def_obj_command);
    end
    
    x0fields=fields(x0);
    for i=1:length(x0fields)
        field=x0fields{i};
        x0double.(field)=double(x0.(field));
    end

    
    
    [sol,~] = solve(prob,x0double);
%     x0=sol;
end
