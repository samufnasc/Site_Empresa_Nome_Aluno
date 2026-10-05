// js/app.js

// Avatar padrão em SVG (Base64) utilizado quando o usuário não faz upload de foto
const AVATAR_PADRAO = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2394a3b8"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>';

document.addEventListener('DOMContentLoaded', () => {
    carregarTabelaFuncionarios();

    const formFuncionario = document.getElementById('form-funcionario');
    if (formFuncionario) {
        formFuncionario.addEventListener('submit', cadastrarFuncionario);
    }
});

// Cadastrar Funcionário (Com foto opcional)
async function cadastrarFuncionario(event) {
    event.preventDefault();

    const nome = document.getElementById('func_nome').value.trim();
    const email = document.getElementById('func_email').value.trim();
    const cargo = document.getElementById('func_cargo').value.trim();
    const departamento = document.getElementById('func_departamento').value.trim();
    const fotoInput = document.getElementById('func_foto');

    let foto_url = '';

    // SÓ REALIZA O UPLOAD SE UM ARQUIVO DE IMAGEM FOI SELECIONADO
    if (fotoInput.files && fotoInput.files.length > 0) {
        const file = fotoInput.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabaseClient
            .storage
            .from('fotos-funcionarios')
            .upload(fileName, file);

        if (uploadError) {
            alert('Erro ao fazer upload da foto: ' + uploadError.message);
            return;
        }

        // Obtém a URL pública da imagem recém-enviada
        const { data: urlData } = supabaseClient
            .storage
            .from('fotos-funcionarios')
            .getPublicUrl(fileName);

        foto_url = urlData.publicUrl;
    }

    // Inserção no Supabase (se foto_url estiver vazia, grava string vazia ou null no banco)
    const { error } = await supabaseClient
        .from('funcionarios')
        .insert([{ nome, email, cargo, departamento, foto_url }]);

    if (error) {
        alert('Erro ao cadastrar funcionário: ' + error.message);
        return;
    }

    alert('Funcionário cadastrado com sucesso!');
    document.getElementById('form-funcionario').reset();
    carregarTabelaFuncionarios();
}

// Carregar e listar todos os funcionários
async function carregarTabelaFuncionarios() {
    const tbody = document.getElementById('tabela-funcionarios-body');
    if (!tbody) return;

    try {
        const { data: funcionarios, error } = await supabaseClient
            .from('funcionarios')
            .select('*')
            .order('id', { ascending: false });

        if (error) {
            console.error('Erro ao listar funcionários:', error.message);
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color: #ef4444;">Erro ao carregar dados do banco de dados.</td></tr>';
            return;
        }

        tbody.innerHTML = '';
        if (funcionarios && funcionarios.length > 0) {
            funcionarios.forEach(f => {
                // Se f.foto_url não existir ou for vazia, usa o AVATAR_PADRAO
                const imgSrc = (f.foto_url && f.foto_url.trim() !== '') ? f.foto_url : AVATAR_PADRAO;

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><img src="${imgSrc}" alt="${f.nome}" class="avatar-img"></td>
                    <td><strong>${f.nome}</strong></td>
                    <td>${f.email}</td>
                    <td><span class="badge">${f.cargo || '-'}</span></td>
                    <td>${f.departamento || '-'}</td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Nenhum colaborador cadastrado.</td></tr>';
        }
    } catch (err) {
        console.error(err);
    }
}