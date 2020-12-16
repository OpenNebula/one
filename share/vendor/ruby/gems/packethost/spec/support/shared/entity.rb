shared_examples 'an entity' do
  before do
    subject.update_attributes('created_at' => '2015-03-05T17:44:17Z', 'updated_at' => '2015-03-05T17:44:17Z')
  end

  describe '#id' do
    it { expect(subject).to respond_to(:id) }
  end

  [:created_at, :updated_at].each do |timestamp|
    describe timestamp do
      it { expect(subject).to respond_to(timestamp) }
      it { expect(subject.send(timestamp)).to be_a(Time) }
    end
  end
end
