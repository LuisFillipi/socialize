import http from 'http'
import fs from 'node:fs'
import lerDadosUsuario from './dados/lerDadosUsuario.js'
import {formidable} from "formidable"
const PORT = 3333;

const server = http.createServer(async (request, response) => {
    const { method, url } = request;

    if (method === 'POST' && url === '/user') {
        let body = '';
        request.on('data', (chunk) => {
            body += chunk;
        });
        request.on('end', () => {
            if (!body) {
                response.writeHead(400, { 'Content-Type': 'application/json' });
                response.end(JSON.stringify({ message: 'Corpo da solicitação vazio' }));
                return;
            }

            const novoUsuario = JSON.parse(body);

            lerDadosUsuario((err, usuarios) => {
                if (err) {
                    response.writeHead(500, { 'Content-Type': 'application/json' });
                    response.end(JSON.stringify({ message: 'Erro ao cadastrar o usuário' }));
                    return;
                }
                novoUsuario.id = usuarios.length + 1;
                usuarios.push(novoUsuario);

                fs.writeFile('user.json', JSON.stringify(usuarios, null, 2), (err) => {
                    if (err) {
                        response.writeHead(500, { 'Content-Type': 'application/json' });
                        response.end(JSON.stringify({ message: 'Erro ao cadastrar o usuário no arquivo' }));
                        return;
                    }
                    response.writeHead(201, { 'Content-Type': 'application/json' });
                    response.end(JSON.stringify(novoUsuario));
                });
            });
        });
    } else if (method === 'GET' && url === '/user') { 
        lerDadosUsuario((err, usuarios) => {
            if (err) {
                response.writeHead(500, { 'Content-Type': 'application/json' });
                response.end(JSON.stringify({ message: 'Erro ao ler os dados' }));
                return;
            }
            response.writeHead(200, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify(usuarios));
        });
    } else if (method === 'POST' && url === '/login') { 
    
        let body = '';
        request.on('data', (chunk) => {
            body += chunk;
        });
        request.on('end', () => {
            if (!body) {
                response.writeHead(400, { 'Content-Type': 'application/json' });
                response.end(JSON.stringify({ message: 'Corpo da solicitação vazio' }));
                return;
            }

            const novoLogin = JSON.parse(body);

            lerDadosUsuario((err, usuarios) => {
                if (err) {
                    response.writeHead(500, { 'Content-Type': 'application/json' });
                    response.end(JSON.stringify({ message: 'Erro ao logar o usuário' }));
                    return;
                }

                const user = usuarios.find((usuario) => usuario.email === novoLogin.email && usuario.senha === novoLogin.senha);
                if (!user) {
                    response.writeHead(404, { 'Content-Type': 'application/json' });
                    response.end(JSON.stringify({ message: 'Credenciais inválidas' }));
                    return;
                }

                response.writeHead(200, { 'Content-Type': 'application/json' });
                response.end(JSON.stringify({ message: 'Login bem-sucedido' }));
            });
        });
 
    }else if(url.startsWith('/user/') && method === 'GET'){ 
        
        const id = parseInt(url.split('/')[2])

        lerDadosUsuario((err, perfil) => {
            if(err){
                response.writeHead(500, {'Content-Type':'application/json'})
                response.end(JSON.stringify({message: 'Erro interno no servidor'}))
                return; 
            }
            const indexPerfil = perfil.findIndex((perfil) => perfil.id == id)
            if(indexPerfil == -1){
                response.writeHead(404, {'Content-Type':'application/json'})
                response.end(JSON.stringify({message: 'perfil não encontrado'}))
                return;
            }
            const perfilEncontrado = perfil[indexPerfil]
            response.writeHead(200, {'Content-Type':'application/json'})
            response.end(JSON.stringify(perfilEncontrado))
        }) 

    }else if(method === 'PUT' && url.startsWith ('/user/')){ 
        
        const id = parseInt(url.split('/') [2])
        let body = ''
        request.on('data', (chunk)=>{
            body += chunk
        })
        request.on('end', () =>{
            if(!body){
                response.writeHead(400, {'Content-Type':'application/json'})
                response.end(JSON.stringify({message: 'Corpo da solicitação vazio'}))
                return
            }
            lerDadosUsuario((err, usuarios)=>{
                if(err){
                    response.writeHead(500, {'Content-Type':'application/json'})
                    response.end(JSON.stringify({message: 'Erro ao ler dados da receita'}))
                    return
                }
    
                const indexPerfil = usuarios.findIndex((perfil)=> perfil.id === id)
    
                if(indexPerfil === -1){
                    response.writeHead(404, {'Content-Type':'application/json'})
                    response.end(JSON.stringify({message: 'perfil não encontrada'}))
                }
    
                const perfilAtualizado = JSON.parse(body)
                perfilAtualizado.id = id
                usuarios[indexPerfil] = perfilAtualizado
    
                fs.writeFile('user.json', JSON.stringify(usuarios, null, 2), (err)=>{
                    if(err){
                        response.writeHead(500, {'Content-Type': 'application/json'})
                        response.end(JSON.stringify({message:'Não é possivel atualizar a receita'}))
                        return
                    }
                    response.writeHead(201, {'Content-Type':'application/json'})
                    response.end(JSON.stringify(perfilAtualizado))
                })
            });
        });
    }else   if (method === "POST" && url.startsWith("/perfil/imagem/")) {
        
        const id = parseInt(url.split('/')[3])
        const form = formidable({})
        let arquivos;
        let campos;
    
        try{
          [arquivos, campos] = await form.parse(request)
          
        } catch (err) {
          response.writeHead(500, { "Content-Type": "application/json" })
          response.end(JSON.stringify({ message: "Error ao enviar os dados" }))
          return
        }
    
        fs.rename(campos.file[0].filepath, `imgs/${campos.file[0].newFilename}.png`, (err)=>{
          if (err) {
            response.writeHead(500, { "Content-Type": "application/json" })
            response.end(JSON.stringify({ message: "Error ao enviar os dados" }))
            return
          }
        })
        lerDadosUsuario((err, usuarios) => {
            if (err) {
                response.writeHead(500, { 'Content-Type': 'application/json' });
                response.end(JSON.stringify({ message: 'Erro ao cadastrar o usuário' }));
                return;
            }
            let indexatt = usuarios.findIndex((user)=> user.id === id )
            usuarios[indexatt].perfil.imagem =`imgs/${campos.file[0].newFilename}.png`
            fs.writeFile('user.json', JSON.stringify(usuarios, null, 2), (err) => {
                if (err) {
                    response.writeHead(500, { 'Content-Type': 'application/json' });
                    response.end(JSON.stringify({ message: 'Erro ao cadastrar o usuário no arquivo' }));
                    return;
                }

            });
        });
        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ campos, arquivos }, null, 2));
        return;
    
      }
    else{
        response.writeHead(404, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ message: 'Rota não encontrada' }));
    }
});

server.listen(PORT, () => {
    console.log(`Servidor em execução na porta ${PORT}`);
});