class UsersService {
  constructor({ usersRepository }) {
    this.usersRepository = usersRepository;
  }

  async listDirectory() {
    return this.usersRepository.listDirectory();
  }
}

module.exports = UsersService;
