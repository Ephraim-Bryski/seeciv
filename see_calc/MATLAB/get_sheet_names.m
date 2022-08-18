
cd sheets
files=[dir];
file_names={files.name};
names={};
for i=3:length(file_names)
    file_name=file_names{i};
    if contains(file_name,'.json')
        name=replace(file_name,'.json','');
        names=[names,name];
    end
end

txt=jsonencode(names,"PrettyPrint", true);
cd ..

fid = fopen('Sheet Names.json','w');
fprintf(fid,'%s',txt);
fclose(fid);




