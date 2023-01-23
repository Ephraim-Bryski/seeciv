clearvars
use_UI=true;


global SoEs_start init % quick fix so it can be accessed from the compute function

init=true;

SoEs_start=[struct('name','Torque','eqns',...
            [struct('input','a=T*L/(G*J)','result','','display',''),....
            struct('input','J=1/4*pi*r^4','result','','display',''),...
            ]),...
  struct('name','inputs','eqns',...
            [struct('input','L1=2','result','','display',''),....
            struct('input','L2=3','result','','display',''),...
            struct('input','r1=.1','result','','display',''),...
            struct('input','r2=3','result','','display','')]),...
  struct('name','structureA','eqns',...
            [struct('input','ref:Torque','result','','display',''),...
            struct('input','ref:inputs','result','','display','')])
  ];

SoEs_start=[struct('name','A','eqns',...
            [struct('input','y=x','result','','display',''),....
            struct('input','1=x','result','','display',''),....
            
            ]),...
            struct('name','B','eqns',...
            [struct('input','solve A for x','result','','display',''),....
            
            ])
            
            ];


if use_UI
    fig=uifigure;
    h=uihtml(fig);
    h.HTMLSource = 'G:\My Drive\GitHub\calcs\calc.html';
    h.DataChangedFcn = @(src,event)compute(h);
else 
    result=calc_SoEs(SoEs_start);
end


function compute(JS_input)
    global SoEs_start init
    if init
        data=SoEs_start;
    else
        sheet_dir='G:\My Drive\GitHub\calcs\sheets\';
        package=JS_input.Data;
        data=package.data; % if loading, data from load will override this data
        save_name=package.save_name;
        load_name=package.load_name;
        if ~isempty(save_name)
            save([sheet_dir,save_name],"data")
        elseif ~isempty(load_name)
            load([sheet_dir,load_name])
        end
    end
    init=false;
    new_data=calc_SoEs(data);
    JS_input.Data=new_data;
end

% % this would be the main function that calls everything else
% % basic flow:
% some UI 
% pressing Enter has JS package the stuff in the UI into structure
% array
% JS calls this code sends structure array as input
% MATLAB runs this code, this code calls "solve" "optimize" visualize
% stuff etc. (everything)
% this code outputs SoEs_comp, which is fed back to JS to display (as well
% as visuals)
% 
% for rn i wont worry about JS at all, MATLAB IDE will be the UI

% there are list blocks (see create_list_eqns) must have list in the name\
function SoEs=calc_SoEs(SoEs)
    known_SoEs={};
    known_SoEs_idx=[];
    for SoE_i=1:length(SoEs)
        SoE_struct=SoEs(SoE_i);
        name=SoE_struct.name;
        SoE=SoE_struct.eqns;

        if contains(name,'list')
     
            for eqn_i=1:length(SoE)
                SoE_expanded=[];
                eqn=SoE(eqn_i).input;
                if contains(eqn,',')
                    list_split=split(eqn,'=');
                    var=list_split{1};
                    items=split(list_split{2},',');
                    n_items=length(items); % THIS MUST BE AWAYS THE SAME, not chaecking for now cause lazy
                    list_type=true;
                else
                    list_type=false;
                end
        
                for item_i=1:n_items
                    if list_type
                        SoE_expanded=[SoE_expanded,str2sym([var,'_',num2str(item_i),'=',items{item_i}])];
                    else
                        %! assumes variables are one letter
                        eqn_new=eqn;
                        for character=eqn
                            if isstrprop(character,'alpha')
                                eqn_new=replace(eqn_new,character,[character,'_',num2str(item_i)]);
                            end
                        end
                        SoE_expanded=[SoE_expanded,str2sym(eqn_new)];
                        
                    end
                end
                SoEs(SoE_i).eqns(eqn_i).result=SoE_expanded;
                SoEs(SoE_i).eqns(eqn_i).display=make_soe_txt(string(SoE_expanded));
            end
        else
            for line_i=1:length(SoE)
                parse_eqn_input(SoE(line_i).input)
                

    
            end
        end
    %     SoE_comp_struct.name=name;
    %     SoE_struct.result=SoE_comp;
        known_SoEs=[known_SoEs,name];
        known_SoEs_idx=[known_SoEs_idx,SoE_i];
    end



    function parse_eqn_input(line)
        error_msg='';
        line=replace(line,' ','');
        if contains(line,'solve')
            solve_eqn=true;
        else
            solve_eqn=false;
        end
        line=replace(line,'solve','');

        if contains(line,'for')
            eqn_var=split(line,'for');
            line=eqn_var{1};
            solve_var=eqn_var{2};

        else
            solve_var=[];
        end
        

        if contains(line,'=')
            try
                eqns=str2sym(line);
            catch
                error_msg='Cannot understand equation';
            end
        else
            ref_and_sub=split(line,',');
            ref=ref_and_sub{1};

            if any(ismember(known_SoEs,ref))
                ref_idx=ismember(known_SoEs,ref);
                
                ref_SoE=[SoEs(ref_idx).eqns.result];

                if ref_SoE=="error"
                    error_msg=[ref,' has an error'];
                else
                    eqns=[];
                    for ref_eq_i=1:length(ref_SoE)
                        ref_eqn=ref_SoE(ref_eq_i);
                        if length(ref_and_sub)>1 % substitution
                            sub=ref_and_sub(2:end);
                            sub_eqns=split(sub,',');
                            
                            for i=1:length(sub_eqns)
                                sub_eqn=sub_eqns{i};
                                if isempty(sub_eqn)
                                    error_msg='Invalid substitution syntax';
                                else

                                    sub_terms_txt=split(sub_eqn,':');
                                    try
                                        sub_terms=str2sym(sub_terms_txt);
                                        error_reached=false;
                                    catch
                                        error_msg=['Cannot substitute ',sub_terms_txt{2},' for ',sub_terms_txt{1}];
                                        error_reached=true;
                                    end
                              
                                    if ~error_reached
                                        if length(sub_terms)~=2
                                            error_msg=[sub_eqn, ' is invalid substitution syntax'];
                                        else
                                            sub_in=sub_terms(1);
                                            sub_out=sub_terms(2);
                                            ref_eqn=subs(ref_eqn,sub_in,sub_out);
                                            
                                        end
                                    end
                                end
                            end
                        end
                        eqns=[eqns,ref_eqn];
                    end  
                end
            else
                error_msg=['Input must be equation or block name'];
            end    
        end


        if isempty(error_msg)
            if solve_eqn
                [eqns_comp,error_msg]=my_solve(eqns,solve_var);
            else
                eqns_comp=eqns;
            end
            
        end

        % error_msg may have become not empty after last branch bc of my_solve
        if ~isempty(error_msg)
            result="error";
            display=error_msg;
        else
            result=eqns_comp;
            display=make_soe_txt(string(eqns_comp));
        end

        SoEs(SoE_i).eqns(line_i).result=result;
        SoEs(SoE_i).eqns(line_i).display=display;
    end

end







