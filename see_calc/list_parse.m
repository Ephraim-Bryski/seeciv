clearvars
SoE=[struct('input','x=3,4'),struct('input','blky=3,7,8')];
SoE_expanded=parse_list(SoE)
construct_list(SoE_expanded)
function SoE_expanded=parse_list(SoE)
    SoE_expanded=[];

    for eqn_i=1:length(SoE)
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
                SoE_expanded=[SoE_expanded,string(['list',num2str(item_i),'_',var,'=',items{item_i}])]
            else
                %! assumes variables are one letter
%                 eqn_new=eqn;
%                 for character=eqn
%                     if isstrprop(character,'alpha')
%                         eqn_new=replace(eqn_new,character,[character,'_',num2str(item_i)]);
%                     end
%                 end
                eqn_sym=str2sym(eqn);
                vars=symvar(eqn_sym);
                for var=vars
                    eqn_sym=subs(eqn_sym,var,str2sym(['list',num2str(item_i),'_',char(var)]));
                end
                        

                SoE_expanded=[SoE_expanded,string(replace(char(eqn_sym),' == ','='))];
                
            end
        end
%         SoEs(SoE_i).eqns(eqn_i).result=SoE_expanded;
       % SoEs(SoE_i).eqns(eqn_i).display=make_soe_txt(string(SoE_expanded));
    end
end

% lists are only deconstructed (parse_list called) on solve, in which case
% all eqns would just be variable=somenumber so it can be easily parsed

% for now will be written as list3_a which means a[3]
function construct_list(eqns)
    % function starts with list variables and constructs comma seperated
    % text

    % eqns could either be cell array of chars or string array

    % will have intermediate step, first produce structure array with
    % values, then use that to produce text


    list_struc=[];
    for eqn=eqns
        var_val=split(char(eqn),'=');
        var=var_val{1};
        val=var_val{2};
        if contains(var,'list')
            list_base=split(var,'_');
            list_idx=str2num(replace(list_base{1},'list',''));
            base_var=list_base{2};

            list_struc(list_idx).(base_var)=val;

        end
    end

    list_vars=fieldnames(list_struc)';

    %! it actually doesn't need to construct text, just construct an array
    %and then add that into the table which would be displayed
    % except that would also be tricky because it's not obvious how you
    % would say there's a blank , BUT if you're solving it there shoulnd't
    % actually be any blank values, for now ill leave it as is
    list_txts={};
    for list_var=list_vars
        list_var=list_var{1};
        list_txt=[list_var,'='];
        for i=1:length(list_struc)
            val=list_struc(i).(list_var);
            list_txt=[list_txt,val,','];
        end
        list_txt(end)=[];
        list_txts=[list_txts,list_txt];
    end

    list_txts
end










