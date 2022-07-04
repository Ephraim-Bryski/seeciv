
files=[dir];
file_names={files.name};
for i=3:length(file_names)
    file_name=file_names{i};
    load(file_name)

    txt=jsonencode(data,"PrettyPrint", true);
    file_name=replace(file_name,'.mat','.json');

    fid = fopen(file_name,'w');
    fprintf(fid,'%s',txt);
    fclose(fid);

    
end

